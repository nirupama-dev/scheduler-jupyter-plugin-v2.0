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

from google.cloud import kms_v1

from scheduler_jupyter_plugin.commons.constants import CONTENT_TYPE


class Client:
    def __init__(self, credentials, log, client_session):
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
        self.client_session = client_session

    def create_headers(self):
        return {
            "Content-Type": CONTENT_TYPE,
            "Authorization": f"Bearer {self._access_token}",
        }

    async def list_key_rings(self, project_id, region_id):
        try:
            key_rings = []
            cloud_kms_client = kms_v1.KeyManagementServiceAsyncClient()
            request = kms_v1.ListKeyRingsRequest(
                parent=f"projects/{project_id}/locations/{region_id}",
            )
            response = await cloud_kms_client.list_key_rings(request=request)
            async for item in response:
                key_ring = item.name.rsplit("/", 1)[-1]
                key_rings.append(key_ring)
            return key_rings

        except Exception as e:
            self.log.exception(f"Error fetching key rings: {str(e)}")
            return {"Error fetching key rings": str(e)}

    async def list_crypto_keys(self, project_id, region_id, key_ring):
        try:
            crypto_keys = []
            cloud_kms_client = kms_v1.KeyManagementServiceAsyncClient()
            request = kms_v1.ListCryptoKeysRequest(
                parent=f"projects/{project_id}/locations/{region_id}/keyRings/{key_ring}",
            )
            response = await cloud_kms_client.list_crypto_keys(request=request)
            async for item in response:
                crypto_key = item.name.rsplit("/", 1)[-1]
                crypto_keys.append(crypto_key)
            return crypto_keys

        except Exception as e:
            self.log.exception(f"Error fetching crypto keys: {str(e)}")
            return {"Error fetching crypto keys": str(e)}