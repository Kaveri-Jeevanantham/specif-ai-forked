import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { LLMConfigState } from 'src/app/store/llm-config/llm-config.state';
import { distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { LLMConfigModel } from '../../model/interfaces/ILLMConfig';
import { Store } from '@ngxs/store';
import { AvailableProviders } from '../../constants/llm.models.constants';
import { AddBreadcrumbs } from '../../store/breadcrumb/breadcrumb.actions';
import {
  SetLLMConfig,
  SyncLLMConfig,
} from '../../store/llm-config/llm-config.actions';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogService } from '../../services/dialog/dialog.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { NgForOf, NgIf } from '@angular/common';
import { StartupService } from '../../services/auth/startup.service';
import { ToasterService } from '../../services/toaster/toaster.service';
import { ButtonComponent } from '../core/button/button.component';
import { AppSelectComponent } from '../core/app-select/app-select.component';
import {
  APP_CONSTANTS,
  CONFIRMATION_DIALOG,
} from '../../constants/app.constants';
import { environment } from 'src/environments/environment';
import { ElectronService } from 'src/app/electron-bridge/electron.service';
import { NGXLogger } from 'ngx-logger';
import { Router } from '@angular/router';
import { getLLMProviderConfig, ProviderField } from '../../constants/llm-provider-config';
import { AnalyticsEventSource, AnalyticsEvents, AnalyticsEventStatus } from 'src/app/services/analytics/events/analytics.events';
import { AnalyticsTracker } from 'src/app/services/analytics/analytics.interface';
import { getAnalyticsToggleState, setAnalyticsToggleState } from '../../services/analytics/utils/analytics.utils';
import { CoreService, AppConfig } from 'src/app/services/core/core.service';
import { LangfuseConfigService } from 'src/app/services/analytics/observability/langfuse-config.service';
import { heroExclamationTriangle } from '@ng-icons/heroicons/outline';
import { LANGFUSE_CONFIG_STORE_KEY, LangfuseConfigStore } from 'src/app/services/analytics/observability/langfuse-config-type';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    NgForOf,
    NgIf,
    ButtonComponent,
    AppSelectComponent,
  ],
  providers: [
    provideIcons({
      heroExclamationTriangle
    })
  ]
})
export class SettingsComponent implements OnInit, OnDestroy {
  activeTab: 'general' | 'about' = 'general';
  llmConfig$: Observable<LLMConfigModel> = this.store.select(
    LLMConfigState.getConfig,
  );
  currentLLMConfig!: LLMConfigModel;
  availableProviders = [...AvailableProviders].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
  providerOptions = this.availableProviders.map(p => ({
    value: p.key,
    label: p.displayName
  }));
  currentProviderFields: ProviderField[] = [];
  configForm!: FormGroup;
  selectedProvider: FormControl = new FormControl();
  analyticsEnabled: FormControl = new FormControl();
  autoUpdateEnabled: FormControl = new FormControl();
  useLangfuseCustomConfig: FormControl = new FormControl(false);
  langfuseForm!: FormGroup;
  errorMessage: string = '';
  langfuseErrorMessage: string = '';
  hasChanges: boolean = false;
  workingDir: string | null;
  appName = environment.ThemeConfiguration.appName;
  private subscriptions: Subscription = new Subscription();
  private initialProvider: string = '';
  private initialAnalyticsState: boolean = false;
  private initialAutoUpdateState: boolean = true;
  private initialEnableCustomLangfuseToggleState: boolean = false;
  private initialCustomLangfuseConfigState: any = {};
  protected themeConfiguration = environment.ThemeConfiguration;

  electronService = inject(ElectronService);
  logger = inject(NGXLogger);
  router = inject(Router);
  dialogService = inject(DialogService);

  constructor(
    private store: Store,
    private startupService: StartupService,
    private toasterService: ToasterService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private analyticsTracker: AnalyticsTracker,
    private core: CoreService,
    private langfuseConfigService: LangfuseConfigService
  ) {
    this.workingDir = localStorage.getItem(APP_CONSTANTS.WORKING_DIR);
    this.initForm();
  }

  private getAboutInfo() {
    return {
      version: environment.APP_VERSION,
      currentYear: new Date().getFullYear()
    };
  }

  private async updateConfigFields(provider: string) {
    const providerConfig = await getLLMProviderConfig(provider);
    if (!providerConfig) return;

    this.currentProviderFields = providerConfig.fields;
    if (!this.configForm) return;
    const newConfigGroup = this.fb.group({});
    providerConfig.fields.forEach(field => {
      newConfigGroup.addControl(
        field.name,
        this.fb.control(
          field.defaultValue !== undefined ? field.defaultValue : '',
          field.required ? [Validators.required] : []
        )
      );

    });
    this.configForm.setControl('config', newConfigGroup);
    this.applyStoredConfigValues(provider);
    this.cdr.detectChanges();
  }

  private applyStoredConfigValues(provider: string) {
    if (!this.currentLLMConfig || !this.currentLLMConfig.providerConfigs) return;

    const providerConfig = this.currentLLMConfig.providerConfigs[provider];
    if (!providerConfig || !providerConfig.config) return;

    const configGroup = this.configForm.get('config') as FormGroup;
    if (!configGroup) return;

    const storedConfig: Record<string, any> = providerConfig.config;

    configGroup.patchValue(storedConfig, { emitEvent: true });
    this.configForm.markAsPristine();

    this.cdr.markForCheck();
  }

  private loadLangfuseConfig(): void {
    this.electronService.getStoreValue(LANGFUSE_CONFIG_STORE_KEY).then((value: LangfuseConfigStore) => {
      const { langfuseConfig } = value || {};
      if (langfuseConfig) {
        this.useLangfuseCustomConfig.setValue(langfuseConfig.useCustomConfig || false);
        this.initialEnableCustomLangfuseToggleState = langfuseConfig.useCustomConfig || false;
        if (langfuseConfig.config) {
          this.langfuseForm.patchValue(langfuseConfig.config);
          this.initialCustomLangfuseConfigState = { ...langfuseConfig.config };
        }
      }
    });
  }

  private saveLangfuseConfig(): void {
    this.electronService.getStoreValue(LANGFUSE_CONFIG_STORE_KEY).then((value: LangfuseConfigStore) => {
      value = value || {};
      const config = this.useLangfuseCustomConfig.value ? {
        ...this.langfuseForm.value
      } : null;

      const langfuseConfig = {
        useCustomConfig: this.useLangfuseCustomConfig.value,
        config
      };

      this.electronService.setStoreValue(LANGFUSE_CONFIG_STORE_KEY, {
        ...value,
        langfuseConfig
      });

      this.initialEnableCustomLangfuseToggleState = this.useLangfuseCustomConfig.value;
      this.initialCustomLangfuseConfigState = config || {};
    });
  }

  onLangfuseToggleChange() {
    this.subscriptions.add(
      this.useLangfuseCustomConfig.valueChanges
        .pipe(distinctUntilChanged())
        .subscribe((enabled) => {
          if (enabled) {
            this.langfuseForm.enable();
          } else {
            this.langfuseForm.disable();
          }
          this.langfuseErrorMessage = '';
          this.checkForChanges();
          this.cdr.markForCheck();
        }),
    );
  }

  ngOnInit(): void {
    this.store.dispatch(
      new AddBreadcrumbs([
        {
          label: 'Settings',
          url: '/settings'
        }
      ])
    );

    this.loadLangfuseConfig();

    this.electronService.getStoreValue('APP_CONFIG').then((value) => {
      const { isAutoUpdate = true } = value || {};
      this.autoUpdateEnabled.setValue(isAutoUpdate);
      this.initialAutoUpdateState = isAutoUpdate;
    });

    this.core.getAppConfig()
      .then((config: AppConfig) => {
        // Keep analytics enabled state based on user preference
        const analyticsState = getAnalyticsToggleState();
        this.analyticsEnabled.setValue(analyticsState);
        this.initialAnalyticsState = analyticsState;

        // Enable/disable Langfuse toggle based on analytics state
        if (analyticsState) {
          this.useLangfuseCustomConfig.enable();
        } else {
          this.useLangfuseCustomConfig.setValue(false);
          this.useLangfuseCustomConfig.disable();
        }
      })
      .catch((error: any) => {
        console.error('Failed to fetch PostHog configuration:', error);
      });

    const analyticsState = getAnalyticsToggleState();
    this.analyticsEnabled.setValue(analyticsState);
    this.initialAnalyticsState = analyticsState;

    this.onProviderChange();
    this.onAnalyticsToggleChange();
    this.onAutoUpdateToggleChange();
    this.onLangfuseToggleChange();

    const providerControl = this.configForm.get('provider');
    if (providerControl) {
      this.subscriptions.add(
        providerControl.valueChanges.subscribe(async(provider) => {
          await this.updateConfigFields(provider);
          this.errorMessage = '';
        })
      );
    }

    if (this.configForm) {
      // Set initial default values
      const defaultProvider = AvailableProviders[0].key;

      this.configForm.patchValue({
        provider: defaultProvider,
        config: {}
      }, { emitEvent: false });

      this.subscriptions.add(
        this.llmConfig$.subscribe(async (config) => {
          this.currentLLMConfig = config;
          const provider = config?.activeProvider || defaultProvider;
          this.initialProvider = provider;
          this.selectedProvider.setValue(provider);

         await this.updateConfigFields(provider);

          this.configForm?.get('provider')?.setValue(provider, { emitEvent: false });

          this.hasChanges = false;
        }),
      );

      this.subscriptions.add(
        this.configForm.valueChanges.pipe(distinctUntilChanged()).subscribe(() => {
          this.hasChanges = true;
          this.errorMessage = '';
        })
      );
    }
  }

  isFormValid(): boolean {
    const isConfigFormValid = this.configForm?.valid ?? false;
    const isLangfuseValid = !this.useLangfuseCustomConfig.value || this.langfuseForm?.valid;
    return isConfigFormValid && isLangfuseValid;
  }

  private async validateLangfuseConfig(): Promise<boolean> {
    if (!this.useLangfuseCustomConfig.value) return true;
    if (!this.langfuseForm.valid) {
      this.langfuseErrorMessage = 'Please fill in all required Langfuse fields.';
      return false;
    }

    try {
      const response = await this.langfuseConfigService.verifyConfig(this.langfuseForm.value);
      if (response.status === 'failed') {
        this.langfuseErrorMessage = response.message;
        return false;
      }
      return true;
    } catch (error) {
      this.langfuseErrorMessage = 'Failed to validate Langfuse configuration.';
      return false;
    }
  }

  async onSave() {
    if (!this.isFormValid()) return;

    // Validate Langfuse config first if enabled
    if (!(await this.validateLangfuseConfig())) {
      return;
    }
    const analyticsEnabled = this.analyticsEnabled.value;

    if (analyticsEnabled !== this.initialAnalyticsState) {
      this.updateAnalyticsState(analyticsEnabled);
      this.initialAnalyticsState = analyticsEnabled;
    }

    if (this.autoUpdateEnabled.value !== this.initialAutoUpdateState) {
      this.electronService.getStoreValue('APP_CONFIG').then((value) => {
        value = value || {};
        this.initialAutoUpdateState = this.autoUpdateEnabled.value;
        this.electronService.setStoreValue('APP_CONFIG', { ...value, isAutoUpdate: this.autoUpdateEnabled.value });
      })
    }

    const formValue = this.configForm.value;
    const provider = formValue.provider;
    this.configForm.updateValueAndValidity();
    const latestConfigValues = (this.configForm.get('config') as FormGroup).getRawValue();

    // Save Langfuse config first
    if (this.useLangfuseCustomConfig.value !== this.initialEnableCustomLangfuseToggleState ||
        (this.useLangfuseCustomConfig.value && this.langfuseForm.dirty)) {
      this.saveLangfuseConfig();
    }

    this.electronService.verifyLLMConfig(provider, latestConfigValues).then((response) => {
      if (response.status === 'success') {
        const existingConfigs = this.currentLLMConfig.providerConfigs || {};
        const newConfig = {
          activeProvider: formValue.provider,
          providerConfigs: {
            ...existingConfigs,
            [formValue.provider]: {
              config: latestConfigValues
            }
          },
          isDefault: false
        };

        this.store.dispatch(new SetLLMConfig(newConfig)).subscribe(() => {
          this.store.dispatch(new SyncLLMConfig()).subscribe(async () => {
            await this.electronService.setStoreValue('llmConfig', newConfig);
            const providerDisplayName =
              this.availableProviders.find((p) => p.key === provider)
                ?.displayName || provider;
            this.toasterService.showSuccess(
              `${providerDisplayName} configuration verified successfully.`,
            );
            this.router.navigate(['/apps']);
            this.analyticsTracker.trackEvent(AnalyticsEvents.LLM_CONFIG_SAVED, {
              provider: provider,
              model: latestConfigValues.model || latestConfigValues.deployment,
              analyticsEnabled: analyticsEnabled,
              source: AnalyticsEventSource.LLM_SETTINGS,
              status: AnalyticsEventStatus.SUCCESS
            })
          });
        });
      } else {
        // Show error but keep the form values for correction
        this.errorMessage = 'Connection Failed! Please verify your model credentials.';
        this.analyticsTracker.trackEvent(AnalyticsEvents.LLM_CONFIG_SAVED, {
          provider: provider,
          model: latestConfigValues.model || latestConfigValues.deployment,
          analyticsEnabled: analyticsEnabled,
          source: AnalyticsEventSource.LLM_SETTINGS,
          status: AnalyticsEventStatus.FAILURE
        });
        this.cdr.markForCheck();
      }
    }).catch((error) => {
      this.errorMessage = 'LLM configuration verification failed. Please verify your credentials.';
      this.cdr.markForCheck();
      this.analyticsTracker.trackEvent(AnalyticsEvents.LLM_CONFIG_SAVED, {
        provider: provider,
        model: latestConfigValues.model || latestConfigValues.deployment,
        analyticsEnabled: analyticsEnabled,
        source: AnalyticsEventSource.LLM_SETTINGS,
        status: AnalyticsEventStatus.FAILURE
      });
    });
  }
  async selectRootDirectory(): Promise<void> {
    const response = await this.electronService.openDirectory();
    this.logger.debug(response);
    if (response.length > 0) {
      localStorage.setItem(APP_CONSTANTS.WORKING_DIR, response[0]);
      const currentConfig =
        (await this.electronService.getStoreValue('APP_CONFIG')) || {};
      const updatedConfig = { ...currentConfig, directoryPath: response[0] };
      await this.electronService.setStoreValue('APP_CONFIG', updatedConfig);

      this.logger.debug('===>', this.router.url);
      if (this.router.url === '/apps') {
        await this.electronService.reloadApp();
      } else {
        await this.router.navigate(['/apps']);
      }
    }
  }

  openFolderSelector() {
    this.selectRootDirectory().then();
  }

  onProviderChange() {
    this.subscriptions.add(
      this.selectedProvider.valueChanges
        .pipe(distinctUntilChanged())
        .subscribe((provider) => {
          this.configForm.get('provider')?.setValue(provider, { emitEvent: true });
          this.errorMessage = '';
          this.checkForChanges();
          this.cdr.detectChanges();
        }),
    );
  }

  onAnalyticsToggleChange() {
    this.subscriptions.add(
      this.analyticsEnabled.valueChanges
        .pipe(distinctUntilChanged())
        .subscribe((enabled) => {
          if (!enabled) {
            // Disable and uncheck custom Langfuse when analytics is disabled
            this.useLangfuseCustomConfig.setValue(false);
            this.useLangfuseCustomConfig.disable();
          } else {
            this.useLangfuseCustomConfig.enable();
          }
          this.checkForChanges();
          this.cdr.detectChanges();
        }),
    );
  }

  onAutoUpdateToggleChange() {
    this.subscriptions.add(
      this.autoUpdateEnabled.valueChanges
        .pipe(distinctUntilChanged())
        .subscribe((enabled) => {
          this.checkForChanges();
          this.cdr.markForCheck();
        }),
    );
  }

  checkForUpdates() {
    this.electronService.checkForUpdates(true);
  }

  private initForm() {
    this.configForm = this.fb.group({
      provider: ['', Validators.required],
      config: this.fb.group({})
    });

    this.langfuseForm = this.fb.group({
      publicKey: ['', Validators.required],
      secretKey: ['', Validators.required],
      baseUrl: ['', Validators.required],
      enableDetailedTraces: [false]
    });

    // Subscribe to form changes
    this.subscriptions.add(
      this.langfuseForm.valueChanges.subscribe(() => {
        this.langfuseErrorMessage = '';
        this.checkForChanges();
      })
    );

    this.subscriptions.add(
      this.configForm.valueChanges.subscribe(() => {
        this.checkForChanges();
      })
    );
  }

  private checkForChanges() {
    const formValue = this.configForm.value;

    // Add null checks for currentLLMConfig
    const activeProvider = this.currentLLMConfig?.activeProvider;
    const currentConfig = activeProvider && this.currentLLMConfig?.providerConfigs?.[activeProvider]?.config;

    // Compare provider
    const hasProviderChanged = formValue.provider !== this.initialProvider;

    // Compare config fields
    let hasConfigChanged = false;
    if (formValue.config && currentConfig) {
      hasConfigChanged = JSON.stringify(formValue.config) !== JSON.stringify(currentConfig);
    }

    // Compare Langfuse changes
    const hasLangfuseToggleChanged = this.useLangfuseCustomConfig.value !== this.initialEnableCustomLangfuseToggleState;
    const hasLangfuseValuesChanged = this.useLangfuseCustomConfig.value &&
      JSON.stringify(this.langfuseForm.value) !== JSON.stringify(this.initialCustomLangfuseConfigState);

    // Compare other toggles
    const hasAnalyticsChanged = this.analyticsEnabled.value !== this.initialAnalyticsState;
    const hasAutoUpdateChanged = this.autoUpdateEnabled.value !== this.initialAutoUpdateState;

    this.hasChanges =
      hasProviderChanged ||
      hasConfigChanged ||
      hasAnalyticsChanged ||
      hasAutoUpdateChanged ||
      hasLangfuseToggleChanged ||
      hasLangfuseValuesChanged;
  }

  updateAnalyticsState(enabled: boolean): void {
    setAnalyticsToggleState(enabled);
    this.electronService.setStoreValue('analyticsEnabled', enabled);
    if (enabled) {
      this.analyticsTracker.initAnalytics();
    }
  }

  navigateToHome() {
    if (this.hasChanges) {
      this.dialogService
        .confirm({
          title: CONFIRMATION_DIALOG.UNSAVED_CHANGES.TITLE,
          description: CONFIRMATION_DIALOG.UNSAVED_CHANGES.DESCRIPTION,
          cancelButtonText: CONFIRMATION_DIALOG.UNSAVED_CHANGES.CANCEL_BUTTON_TEXT,
          confirmButtonText: CONFIRMATION_DIALOG.UNSAVED_CHANGES.PROCEED_BUTTON_TEXT,
        })
        .subscribe((confirmed: boolean) => {
          if (!confirmed) {
            this.analyticsEnabled.setValue(this.initialAnalyticsState);
            this.router.navigate(['/apps']);
          }
        });
      return;
    }
  }

  resetApp() {
    this.dialogService
      .confirm({
        title: 'Reset Settings',
        description: 'Are you sure you want to reset the Settings? This will clear all settings and configurations.',
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Reset Settings',
      })
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.performAppReset();
        }
      });
  }

  private async performAppReset() {
    try {
      // Clear localStorage
      localStorage.removeItem(APP_CONSTANTS.USER_NAME);
      localStorage.removeItem(APP_CONSTANTS.WORKING_DIR);
      localStorage.removeItem(APP_CONSTANTS.USER_ID);

      // Clear electron store values
      await this.electronService.setStoreValue('llmConfig', null);
      await this.electronService.setStoreValue('APP_CONFIG', null);
      await this.electronService.setStoreValue('analyticsEnabled', false);
      await this.electronService.setStoreValue(LANGFUSE_CONFIG_STORE_KEY, null);

      // Clear in-memory store
      await this.store.dispatch(new SetLLMConfig({
        activeProvider: '',
        providerConfigs: {},
        isDefault: true
      })).toPromise();

      // Reset analytics state
      setAnalyticsToggleState(false);

      // Clear form data
      this.configForm.reset();
      this.langfuseForm.reset();
      this.analyticsEnabled.setValue(false);
      this.autoUpdateEnabled.setValue(true);
      this.useLangfuseCustomConfig.setValue(false);

      this.toasterService.showSuccess('Settings reset successfully. Redirecting to login...');
      
      this.startupService.logout()
      
    } catch (error) {
      this.logger.error('Error during app reset:', error);
      this.toasterService.showError('Failed to reset application. Please try again.');
    }
  }

  logout() {
    // Close the settings modal and open the logout confirmation dialog
    this.dialogService
      .confirm({
        title: CONFIRMATION_DIALOG.LOGOUT.TITLE,
        description: CONFIRMATION_DIALOG.LOGOUT.DESCRIPTION,
        cancelButtonText: CONFIRMATION_DIALOG.LOGOUT.CANCEL_BUTTON_TEXT,
        confirmButtonText: CONFIRMATION_DIALOG.LOGOUT.PROCEED_BUTTON_TEXT,
      })
      .subscribe((confirmed: boolean) => {
        if (confirmed) this.startupService.logout();
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onTabChange(tab: 'general'| 'about') {
    this.activeTab = tab;
  }

  getAboutContent() {
    const { version, currentYear } = this.getAboutInfo();

    return {
      version,
      currentYear,
      appName: this.appName
    };
  }
}
