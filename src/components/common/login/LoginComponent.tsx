import React from 'react';
import { IThemeManager } from '@jupyterlab/apputils';
// import { IconsigninGoogle } from '../../../utils/Icons';
// import { authApi } from './Config';
// import { IAuthCredentials } from '../../../interfaces/LoginInterfaces';
import { SchedulerWidget } from '../widget/SchedulerWidget';
import LoginErrorComponent from './LoginErrorComponent';

export class AuthenticationWidget extends SchedulerWidget {
  isAuthenticated: number | undefined = 1;
  constructor(themeManager: IThemeManager) {
    super(themeManager);
    // this.title.label = 'Login';
    // this.title.closable = true;
    // this.id = 'scheduler-login-component';
    // this.addClass('scheduler-login-component');
    // (async () => {
    //   const credentials: IAuthCredentials | undefined =
    //     await this.checkLoginStatus();
    //   this.isAuthenticated = credentials?.login_error;
    //   this.update();
    // })();
  }

  //   checkLoginStatus = async () => {
  //     return await authApi();
  //   };

  // credentials api anc ceck login sttaus

  //   dispose() {
  //     return super.dispose();
  //   }

  protected renderInternal(): React.ReactElement {
    return (
      <>
        <LoginErrorComponent />
      </>
    );
  }
}
