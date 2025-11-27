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


from google.cloud import resourcemanager_v3
import google.oauth2.credentials as oauth2
from google.auth.exceptions import RefreshError


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

    async def list_gcp_projects(self):
        try:
            credentials = oauth2.Credentials(self._access_token)
            proj_client = resourcemanager_v3.ProjectsClient(credentials=credentials)

            projects = []
            projects_iterator = proj_client.search_projects()
            for project in projects_iterator:
                projects.append(
                    {
                        "project_id": project.project_id,
                        "name": project.display_name,
                    }
                )
            return projects

        except RefreshError as e:
            self.log.exception(f"AUTHENTICATION_ERROR: {str(e)}")
            raise RuntimeError({"AUTHENTICATION_ERROR": str(e), "status": 401})
        except Exception as e:
            self.log.exception(f"Error fetching projects: {str(e)}")
            return {"error": str(e)}
