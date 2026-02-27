# Copyright 2026 Google LLC
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


import aiohttp
import json
from cron_descriptor import get_description

import google.oauth2.credentials as oauth2
from google.cloud import storage

from scheduler_jupyter_plugin.commons.constants import (
    CONTENT_TYPE,
    CRON_EVERY_MINUTE,
    HTTP_STATUS_NOT_FOUND,
    HTTP_STATUS_OK,
    HTTP_STATUS_FORBIDDEN,
    HTTP_STATUS_NO_CONTENT,
    HTTP_STATUS_UNAUTHORIZED,
)
from scheduler_jupyter_plugin.models.models import DescribeBucketName


class Client:
    client_session = aiohttp.ClientSession()

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

    async def create_gcs_bucket(self, bucket_name):
        self.log.info(f"Creating GCS bucket: {bucket_name}")
        try:
            if not bucket_name:
                raise ValueError("Bucket name cannot be empty")
            credentials = oauth2.Credentials(token=self._access_token)
            storage_client = storage.Client(
                credentials=credentials, project=self.project_id
            )
            storage_client.create_bucket(bucket_name)
            self.log.info(f"GCS bucket '{bucket_name}' created successfully")
        except Exception as error:
            self.log.exception(f"Error in creating Bucket: {error}")
            raise IOError(f"Error in creating Bucket: {error}")

    async def upload_to_gcs(self, bucket_name, file_path, job_name):
        self.log.info(f"Uploading file {file_path} to GCS bucket {bucket_name}")
        input_notebook = file_path.split("/")[-1]
        credentials = oauth2.Credentials(self._access_token)
        storage_client = storage.Client(
            credentials=credentials, project=self.project_id
        )
        bucket = storage_client.bucket(bucket_name)
        blob_name = None

        if "gs:" not in file_path:
            # uploading the input file
            blob_name = f"{job_name}/{input_notebook}"
            blob = bucket.blob(blob_name)
            blob.upload_from_filename(file_path)
            self.log.info(f"File {input_notebook} uploaded to gcs successfully")

            # creating json file containing the input file path
            metadata = {"inputFilePath": f"gs://{bucket_name}/{blob_name}"}
        else:
            metadata = {"inputFilePath": file_path}

        json_file_name = f"{job_name}.json"

        with open(json_file_name, "w") as f:
            json.dump(metadata, f, indent=4)

        # uploading json file containing the input file path
        json_blob_name = f"{job_name}/{json_file_name}"
        json_blob = bucket.blob(json_blob_name)
        json_blob.upload_from_filename(json_file_name)
        self.log.info(f"Metadata file {json_file_name} uploaded to gcs successfully")

    async def create_schedule(self, job, region_id):
        self.log.info(f"Creating schedule for job: {job.get('displayName')}")
        api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{region_id}/schedules"
        headers = self.create_headers()
        payload = job
        async with self.client_session.post(
            api_endpoint, headers=headers, json=payload
        ) as response:
            if response.status == HTTP_STATUS_OK:
                resp = await response.json()
                return resp
            elif response.status == HTTP_STATUS_UNAUTHORIZED:
                self.log.exception(
                    f"AUTHENTICATION_ERROR: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {
                        "AUTHENTICATION_ERROR": await response.json(),
                        "status": response.status,
                    }
                )
            elif response.status == HTTP_STATUS_NOT_FOUND:
                raise RuntimeError(
                    {"ERROR": response.reason, "status": response.status}
                )
            else:
                self.log.exception("Error creating the schedule")
                raise RuntimeError(
                    {"ERROR": await response.json(), "status": response.status}
                )

    async def create_job_schedule(self, data, region_id):
        job = data["vertexScheduleData"]
        local_input_file_path = data["localInputFilePath"]
        self.log.info(
            f"Creating job schedule for job: {job.get('displayName')} with input file: {local_input_file_path}"
        )
        try:
            storage_bucket = job["createNotebookExecutionJobRequest"][
                "notebookExecutionJob"
            ]["gcsOutputUri"].split("//")[-1]

            await self.upload_to_gcs(
                storage_bucket, local_input_file_path, job["displayName"]
            )
            res = await self.create_schedule(job, region_id)
            self.log.info(
                f"Schedule created successfully for job: {job.get('displayName')}"
            )
            return res
        except Exception as e:
            print("error:", str(e))
            self.log.exception(
                f"Error creating job schedule for job: {job.get('displayName')}"
            )
            return {"error": str(e)}

    async def create_new_bucket(self, input_data):
        self.log.info(f"Creating new GCS bucket with input data: {input_data}")
        try:
            data = DescribeBucketName(**input_data)
            res = await self.create_gcs_bucket(data.bucket_name)
            self.log.info(f"New GCS bucket created: {data.bucket_name}")
            return res
        except Exception as e:
            self.log.exception(
                f"Error creating new GCS bucket with input data: {input_data}"
            )
            return {"error": str(e)}

    async def list_uiconfig(self, region_id):
        self.log.info(f"Listing vertex ui config for region: {region_id}")
        uiconfig = []
        api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/ui/projects/{self.project_id}/locations/{region_id}/uiConfig"

        headers = self.create_headers()
        async with self.client_session.get(api_endpoint, headers=headers) as response:
            if response.status == HTTP_STATUS_OK:
                resp = await response.json()
                if not resp:
                    self.log.info(f"No vertex ui config found for region: {region_id}")
                    return uiconfig
                else:
                    if (
                        "notebookRuntimeConfig" in resp
                        and "machineConfigs" in resp["notebookRuntimeConfig"]
                    ):
                        for machineconfig in resp["notebookRuntimeConfig"][
                            "machineConfigs"
                        ]:
                            rambytes_in_gb = round(
                                int(machineconfig.get("ramBytes")) / 1000000000, 2
                            )
                            formatted_config = {
                                "machineType": f"{machineconfig.get('machineType')} ({machineconfig.get('cpuCount')} CPUs, {rambytes_in_gb} GB RAM)",
                                "acceleratorConfigs": machineconfig.get(
                                    "acceleratorConfigs"
                                ),
                            }
                            uiconfig.append(formatted_config)
                    self.log.info(
                        f"Successfully retrieved vertex ui config for region: {region_id}"
                    )
                    return uiconfig
            elif response.status == HTTP_STATUS_UNAUTHORIZED:
                self.log.exception(
                    f"AUTHENTICATION_ERROR: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {
                        "AUTHENTICATION_ERROR": await response.json(),
                        "status": response.status,
                    }
                )
            elif response.status == HTTP_STATUS_FORBIDDEN:
                resp = await response.json()
                self.log.exception(f"FORBIDDEN_ERROR: {response.reason} {resp}")
                return resp
            elif response.status == HTTP_STATUS_NOT_FOUND:
                self.log.exception(
                    f"Vertex UI config not found for region: {region_id}"
                )
                raise RuntimeError(
                    {"ERROR": response.reason, "status": response.status}
                )
            else:
                self.log.exception(
                    f"Error getting vertex ui config: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {"ERROR": await response.json(), "status": response.status}
                )

    def parse_schedule(self, cron):
        return get_description(cron)

    async def list_schedules(self, region_id, page_size=100, next_page_token=None):
        self.log.info(f"Listing schedules for region: {region_id}")
        result = {}

        if next_page_token:
            api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{region_id}/schedules?orderBy=createTime desc&pageToken={next_page_token}&pageSize={page_size}&filter=createNotebookExecutionJobRequest:*"

        else:
            api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{region_id}/schedules?orderBy=createTime desc&pageSize={page_size}&filter=createNotebookExecutionJobRequest:*"

        headers = self.create_headers()
        async with self.client_session.get(api_endpoint, headers=headers) as response:
            if response.status == HTTP_STATUS_OK:
                resp = await response.json()
                if not resp:
                    self.log.info(f"No schedules found for region: {region_id}")
                    return result
                else:
                    schedule_list = []
                    schedules = resp.get("schedules")
                    for schedule in schedules:
                        # filter for a workbench schedule
                        # ie atleast any one of the following is not available.
                        # workbenchRuntime or kernel or customEnvironmentSpec
                        if (
                            schedule.get("createNotebookExecutionJobRequest").get(
                                "notebookExecutionJob"
                            )
                            is None
                        ):
                            continue
                        notebook_execution_job = schedule.get(
                            "createNotebookExecutionJobRequest"
                        ).get("notebookExecutionJob")
                        if (
                            notebook_execution_job.get("workbenchRuntime") is None
                            and notebook_execution_job.get("kernelName") is None
                            and notebook_execution_job.get("customEnvironmentSpec")
                            is None
                        ):
                            continue
                        max_run_count = schedule.get("maxRunCount")
                        cron = schedule.get("cron")
                        cron_value = (
                            cron.split(" ", 1)[1] if (cron and "TZ" in cron) else cron
                        )
                        if max_run_count == "1" and cron_value == CRON_EVERY_MINUTE:
                            schedule_value = "run once"
                        else:
                            schedule_value = self.parse_schedule(cron)

                        formatted_schedule = {
                            "name": schedule.get("name"),
                            "displayName": schedule.get("displayName"),
                            "schedule": schedule_value,
                            "status": schedule.get("state"),
                            "createTime": schedule.get("createTime"),
                            "nextRunTime": schedule.get("nextRunTime"),
                            "gcsNotebookSourceUri": schedule.get(
                                "createNotebookExecutionJobRequest"
                            )
                            .get("notebookExecutionJob")
                            .get("gcsNotebookSource"),
                            "lastScheduledRunResponse": schedule.get(
                                "lastScheduledRunResponse"
                            ),
                        }
                        schedule_list.append(formatted_schedule)
                    resp["schedules"] = schedule_list
                    result.update(resp)
                    self.log.info(
                        f"Successfully retrieved schedules for region: {region_id}"
                    )
                    return result
            elif response.status == HTTP_STATUS_UNAUTHORIZED:
                self.log.exception(
                    f"AUTHENTICATION_ERROR: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {
                        "AUTHENTICATION_ERROR": await response.json(),
                        "status": response.status,
                    }
                )
            elif response.status == HTTP_STATUS_FORBIDDEN:
                resp = await response.json()
                self.log.exception(f"FORBIDDEN_ERROR: {response.reason} {resp}")
                return resp
            elif response.status == HTTP_STATUS_NOT_FOUND:
                self.log.exception(f"No schedules found for region: {region_id}")
                raise RuntimeError(
                    {"ERROR": response.reason, "status": response.status}
                )
            else:
                self.log.exception(
                    f"Error listing schedules: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {"ERROR": await response.json(), "status": response.status}
                )

    async def pause_schedule(self, region_id, schedule_id):
        self.log.info(
            f"Pausing schedule with id: {schedule_id} for region: {region_id}"
        )
        api_endpoint = (
            f"https://{region_id}-aiplatform.googleapis.com/v1/{schedule_id}:pause"
        )

        headers = self.create_headers()
        async with self.client_session.post(api_endpoint, headers=headers) as response:
            if response.status == HTTP_STATUS_OK:
                self.log.info(
                    f"Schedule with id: {schedule_id} paused successfully for region: {region_id}"
                )
                return await response.json()
            elif response.status == HTTP_STATUS_NO_CONTENT:
                self.log.info(
                    f"Schedule with id: {schedule_id} paused successfully for region: {region_id}"
                )
                return {"message": "Schedule paused successfully"}
            elif response.status == HTTP_STATUS_UNAUTHORIZED:
                self.log.exception(
                    f"AUTHENTICATION_ERROR: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {
                        "AUTHENTICATION_ERROR": await response.json(),
                        "status": response.status,
                    }
                )
            elif response.status == HTTP_STATUS_NOT_FOUND:
                self.log.exception(
                    f"Schedule with id: {schedule_id} not found for region: {region_id}"
                )
                raise RuntimeError(
                    {"ERROR": response.reason, "status": response.status}
                )
            else:
                self.log.exception(
                    f"Error pausing the schedule: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {"ERROR": await response.json(), "status": response.status}
                )

    async def resume_schedule(self, region_id, schedule_id):
        self.log.info(
            f"Resuming schedule with id: {schedule_id} for region: {region_id}"
        )
        api_endpoint = (
            f"https://{region_id}-aiplatform.googleapis.com/v1/{schedule_id}:resume"
        )

        headers = self.create_headers()
        async with self.client_session.post(api_endpoint, headers=headers) as response:
            if response.status == HTTP_STATUS_OK:
                self.log.info(
                    f"Schedule with id: {schedule_id} resumed successfully for region: {region_id}"
                )
                return await response.json()
            elif response.status == HTTP_STATUS_NO_CONTENT:
                self.log.info(
                    f"Schedule with id: {schedule_id} resumed successfully for region: {region_id}"
                )
                return {"message": "Schedule resumed successfully"}
            elif response.status == HTTP_STATUS_UNAUTHORIZED:
                self.log.exception(
                    f"AUTHENTICATION_ERROR: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {
                        "AUTHENTICATION_ERROR": await response.json(),
                        "status": response.status,
                    }
                )
            elif response.status == HTTP_STATUS_NOT_FOUND:
                self.log.exception(
                    f"Schedule with id: {schedule_id} not found for region: {region_id}"
                )
                raise RuntimeError(
                    {"ERROR": response.reason, "status": response.status}
                )
            else:
                self.log.exception(
                    f"Error resuming the schedule: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {"ERROR": await response.json(), "status": response.status}
                )

    async def delete_schedule(self, region_id, schedule_id):
        self.log.info(
            f"Deleting schedule with id: {schedule_id} for region: {region_id}"
        )
        api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/v1/{schedule_id}"

        headers = self.create_headers()
        async with self.client_session.delete(
            api_endpoint, headers=headers
        ) as response:
            if response.status == HTTP_STATUS_OK:
                self.log.info(
                    f"Schedule with id: {schedule_id} deleted successfully for region: {region_id}"
                )
                return await response.json()
            elif response.status == HTTP_STATUS_NO_CONTENT:
                self.log.info(
                    f"Schedule with id: {schedule_id} deleted successfully for region: {region_id}"
                )
                return {"message": "Schedule deleted successfully"}
            elif response.status == HTTP_STATUS_UNAUTHORIZED:
                self.log.exception(
                    f"AUTHENTICATION_ERROR: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {
                        "AUTHENTICATION_ERROR": await response.json(),
                        "status": response.status,
                    }
                )
            elif response.status == HTTP_STATUS_NOT_FOUND:
                self.log.exception(
                    f"Schedule with id: {schedule_id} not found for region: {region_id}"
                )
                raise RuntimeError(
                    {"ERROR": response.reason, "status": response.status}
                )
            else:
                self.log.exception(
                    f"Error deleting the schedule: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {"ERROR": await response.json(), "status": response.status}
                )

    async def get_schedule(self, region_id, schedule_id):
        self.log.info(
            f"Getting schedule with id: {schedule_id} for region: {region_id}"
        )
        api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/v1/{schedule_id}"

        headers = self.create_headers()
        async with self.client_session.get(api_endpoint, headers=headers) as response:
            if response.status == HTTP_STATUS_OK:
                self.log.info(
                    f"Schedule with id: {schedule_id} retrieved successfully for region: {region_id}"
                )
                return await response.json()
            elif response.status == HTTP_STATUS_UNAUTHORIZED:
                self.log.exception(
                    f"AUTHENTICATION_ERROR: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {
                        "AUTHENTICATION_ERROR": await response.json(),
                        "status": response.status,
                    }
                )
            elif response.status == HTTP_STATUS_NOT_FOUND:
                self.log.exception(
                    f"Schedule with id: {schedule_id} not found for region: {region_id}"
                )
                raise RuntimeError(
                    {"ERROR": response.reason, "status": response.status}
                )
            else:
                self.log.exception(
                    f"Error getting the schedule: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {"ERROR": await response.json(), "status": response.status}
                )

    async def trigger_schedule(self, region_id, schedule_id):
        data = await self.get_schedule(region_id, schedule_id)
        self.log.info(
            f"Triggering schedule with id: {schedule_id} for region: {region_id}"
        )
        api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{region_id}/notebookExecutionJobs"

        headers = self.create_headers()
        payload = data.get("createNotebookExecutionJobRequest").get(
            "notebookExecutionJob"
        )
        payload["scheduleResourceName"] = data.get("name")
        async with self.client_session.post(
            api_endpoint, headers=headers, json=payload
        ) as response:
            if response.status == HTTP_STATUS_OK:
                self.log.info(
                    f"Schedule with id: {schedule_id} triggered successfully for region: {region_id}"
                )
                return await response.json()
            elif response.status == HTTP_STATUS_UNAUTHORIZED:
                self.log.exception(
                    f"AUTHENTICATION_ERROR: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {
                        "AUTHENTICATION_ERROR": await response.json(),
                        "status": response.status,
                    }
                )
            elif response.status == HTTP_STATUS_NOT_FOUND:
                self.log.exception(
                    f"Schedule with id: {schedule_id} not found for region: {region_id}"
                )
                raise RuntimeError(
                    {"ERROR": response.reason, "status": response.status}
                )
            else:
                self.log.exception(
                    f"Error triggering the schedule: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {"ERROR": await response.json(), "status": response.status}
                )

    async def update_schedule(self, region_id, schedule_id, input_data):
        self.log.info(
            f"Updating schedule with id: {schedule_id} for region: {region_id}"
        )
        keys = input_data.keys()
        keys_to_filter = ["displayName", "maxConcurrentRunCount"]
        filtered_keys = [
            item for item in keys if not any(key in item for key in keys_to_filter)
        ]
        update_mask = ",".join(filtered_keys)
        api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/v1/{schedule_id}?updateMask={update_mask}"

        headers = self.create_headers()
        async with self.client_session.patch(
            api_endpoint, headers=headers, json=input_data
        ) as response:
            if response.status == HTTP_STATUS_OK:
                self.log.info(
                    f"Schedule with id: {schedule_id} updated successfully for region: {region_id}"
                )
                return await response.json()
            elif response.status == HTTP_STATUS_UNAUTHORIZED:
                self.log.exception(
                    f"AUTHENTICATION_ERROR: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {
                        "AUTHENTICATION_ERROR": await response.json(),
                        "status": response.status,
                    }
                )
            elif response.status == HTTP_STATUS_NOT_FOUND:
                self.log.exception(
                    f"Schedule with id: {schedule_id} not found for region: {region_id}"
                )
                raise RuntimeError(
                    {"ERROR": response.reason, "status": response.status}
                )
            else:
                self.log.exception(
                    f"Error updating the schedule: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {"ERROR": await response.json(), "status": response.status}
                )

    async def list_notebook_execution_jobs(
        self, region_id, schedule_id, order_by, page_size=None, start_date=None
    ):
        self.log.info(
            f"Listing notebook execution jobs for schedule id: {schedule_id} in region: {region_id}"
        )
        execution_jobs = []
        if page_size:
            api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{region_id}/notebookExecutionJobs?filter=schedule={schedule_id}&pageSize={page_size}&orderBy={order_by}"
        else:
            api_endpoint = f"https://{region_id}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{region_id}/notebookExecutionJobs?filter=schedule={schedule_id}&orderBy={order_by}"

        headers = self.create_headers()
        async with self.client_session.get(api_endpoint, headers=headers) as response:
            if response.status == HTTP_STATUS_OK:
                self.log.info(
                    f"Successfully retrieved notebook execution jobs for schedule id: {schedule_id} in region: {region_id}"
                )
                resp = await response.json()
                if not resp:
                    return execution_jobs
                else:
                    jobs = resp.get("notebookExecutionJobs")
                    for job in jobs:
                        if start_date:
                            # getting only the jobs whose create time is equal to start date
                            # splitting it in order to get only the date part from the values which is in zulu format (2011-08-12T20:17:46.384Z)
                            if (
                                start_date.rsplit("-", 1)[0]
                                == job.get("createTime").rsplit("-", 1)[0]
                            ):
                                execution_jobs.append(job)
                        else:
                            execution_jobs.append(job)
                    self.log.info(
                        f"Notebook execution jobs retrieved for schedule id: {schedule_id} in region: {region_id}"
                    )
                    return execution_jobs
            elif response.status == HTTP_STATUS_UNAUTHORIZED:
                self.log.exception(
                    f"AUTHENTICATION_ERROR: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {
                        "AUTHENTICATION_ERROR": await response.json(),
                        "status": response.status,
                    }
                )
            elif response.status == HTTP_STATUS_NOT_FOUND:
                self.log.exception(
                    f"No notebook execution jobs found for schedule id: {schedule_id} in region: {region_id}"
                )
                raise RuntimeError(
                    {"ERROR": response.reason, "status": response.status}
                )
            else:
                self.log.exception(
                    f"Error fetching notebook execution jobs: {response.reason} {await response.text()}"
                )
                raise RuntimeError(
                    {"ERROR": await response.json(), "status": response.status}
                )
