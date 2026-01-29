# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.auth.exceptions import RefreshError
from google.cloud import service_usage_v1
import google.oauth2.credentials as oauth2


class Client:
    def __init__(self, credentials, log):
        self.log = log
        if not (
            ("access_token" in credentials)
            and ("project_id" in credentials)
            and ("region_id" in credentials)
        ):
            self.log.exception("Missing required credentials")
            raise ValueError("Missing required credentials")
        self._access_token = credentials["access_token"]
        self.project_id = credentials["project_id"]
        self.region_id = credentials["region_id"]

    async def check_api_enabled(self, project_id, api_service_name):
        try:
            credentials = oauth2.Credentials(self._access_token)
            service_usage_client = service_usage_v1.ServiceUsageClient(
                credentials=credentials
            )
            name = f"projects/{project_id}/services/{api_service_name}"
            response = service_usage_client.get_service(request={"name": name})

            # State can be ENABLED or DISABLED
            if response.state == service_usage_v1.State.ENABLED:
                return True
            else:
                return False
        except RefreshError as e:
            self.log.exception(f"AUTHENTICATION_ERROR: {str(e)}")
            raise RuntimeError({"AUTHENTICATION_ERROR": str(e), "status": 401})
        except Exception as e:
            self.log.exception(f"Error checking {api_service_name}: {str(e)}")
            return {"error": str(e)}
