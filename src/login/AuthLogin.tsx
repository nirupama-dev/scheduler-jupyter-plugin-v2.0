// /**
//  * @license
//  * Copyright 2025 Google LLC
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *   http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */

// import React, { useEffect, useState } from 'react';
// import { checkConfig } from '../utils/Config';
// import { SchedulerWidget } from '../controls/SchedulerWidget';
// import { IThemeManager } from '@jupyterlab/apputils';
// import { ILauncher } from '@jupyterlab/launcher';
// import { JupyterLab } from '@jupyterlab/application';
// import { ISettingRegistry } from '@jupyterlab/settingregistry';
// import { CircularProgress } from '@mui/material';
// import { LOGIN_STATE } from '../utils/Const';

// const AuthLoginComponent = ({
//   app,
//   launcher,
//   settingRegistry,
//   themeManager
// }: {
//   app: JupyterLab;
//   launcher: ILauncher;
//   settingRegistry: ISettingRegistry;
//   themeManager: IThemeManager;
// }): React.JSX.Element => {
//   const [loginState, setLoginState] = useState(false);
//   const [configError, setConfigError] = useState(false);
//   const [loginError, setLoginError] = useState(false);
//   const [configLoading, setConfigLoading] = useState(true);

//   useEffect(() => {
//     checkConfig(setLoginState, setConfigError, setLoginError);
//     const localstorageGetInformation = localStorage.getItem('loginState');
//     setLoginState(localstorageGetInformation === LOGIN_STATE);
//     if (loginState) {
//       setConfigLoading(false);
//     }
//   }, []);

//   return (
//     <div className="component-level">
//       {configLoading && !loginState && !configError && !loginError && (
//         <div className="spin-loader-main">
//           <CircularProgress
//             className="spin-loader-custom-style"
//             size={18}
//             aria-label="Loading Spinner"
//             data-testid="loader"
//           />
//           Loading Config Setup
//         </div>
//       )}
//        {(loginError || configError) && <div className="component-level"></div>}
//     </div>
//   );
// };

// export class AuthLogin extends SchedulerWidget {
//   app: JupyterLab;
//   launcher: ILauncher;
//   settingRegistry: ISettingRegistry;

//   constructor(
//     app: JupyterLab,
//     launcher: ILauncher,
//     settingRegistry: ISettingRegistry,
//     themeManager: IThemeManager
//   ) {
//     super(themeManager);
//     this.app = app;
//     (this.settingRegistry = settingRegistry), (this.launcher = launcher);
//   }

//   renderInternal(): React.JSX.Element {
//     return (
//       <AuthLoginComponent
//         app={this.app}
//         launcher={this.launcher}
//         settingRegistry={this.settingRegistry}
//         themeManager={this.themeManager}
//       />
//     );
//   }
// }
