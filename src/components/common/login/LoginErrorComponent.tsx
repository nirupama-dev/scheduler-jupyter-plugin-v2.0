/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
// import { login } from './Config';
import { IconsigninGoogle } from '../../../utils/Icons';
// import { useLocation } from 'react-router-dom';

const LoginErrorComponent: React.FC = () => {
  // const location = useLocation();
  // const { loginError } = location.state;
  // const [error, setError] = useState(loginError);

  // useEffect(() => {
  //   setError(loginError);
  // }, [loginError]);

  const handleLogin = async () => {
    // const result = await login();
    // setError(!result);
  };

  // console.log('login error component', error);

  // if (error) {
  return (
    <>
      <div className="login-error">Please login to continue</div>
      <div style={{ alignItems: 'center' }}>
        <div role="button" className="signin-google-icon" onClick={handleLogin}>
          <IconsigninGoogle.react tag="div" className="logo-alignment-style" />
        </div>
      </div>
    </>
  );
  // }

  // return null;
};

export default LoginErrorComponent;
