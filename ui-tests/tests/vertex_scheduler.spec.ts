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

import { test, galata } from '@jupyterlab/galata';
import { Page, expect } from '@playwright/test';

// Set a common timeout for all tests
const timeout = 5 * 60 * 1000;

// Generate formatted current date string
const now = new Date();
const pad = (num: number) => String(num).padStart(2, '0');
const dateTimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(Math.floor(now.getMinutes() / 5) * 5)}-${pad(now.getSeconds())}`;

/**
 * Helper function to navigate to Scheduled Jobs listing page.
 * @param {Object} page - Playwright page object.
 */
async function navigateToScheduleJobsListingPage(page: Page) {
  await page
    .locator(
      '//*[@data-category="Google Cloud Resources" and @title="Scheduled Jobs"]'
    )
    .click();
  await page
    .getByText('Loading Vertex Schedules')
    .waitFor({ state: 'detached' });
  await page.waitForTimeout(20000);
}

/**
 * Helper function to check if an input field is not empty.
 * @param {Object} page - Playwright page object.
 * @param {string} label - Label of the input field.
 */
async function checkInputNotEmpty(page: Page, label: string) {
  const input = page.getByLabel(label);
  const value = await input.inputValue();
  return value.trim() !== '';
}

async function checkInputFieldsNotEmpty(page: Page) {
  // Validate that all input fields are not empty
  const jobNameNotEmpty = await checkInputNotEmpty(page, 'Job name*');
  const regionNotEmpty = await checkInputNotEmpty(page, 'Region*');
  const MachinetypeNotEmpty = await checkInputNotEmpty(page, 'Machine type*');
  // const AcceleratortypeNotEmpty = await checkInputNotEmpty(
  //   page,
  //   'Accelerator type'
  // );
  // const AcceleratorcountNotEmpty = await checkInputNotEmpty(
  //   page,
  //   'Accelerator count*'
  // );
  const KernelNotEmpty = await checkInputNotEmpty(page, 'Kernel*');
  const CloudStorageBucketNotEmpty = await checkInputNotEmpty(
    page,
    'Cloud Storage Bucket*'
  );
  const DisktypeNotEmpty = await checkInputNotEmpty(page, 'Disk Type');
  const DisksizeNotEmpty = await checkInputNotEmpty(page, 'Disk Size (in GB)');
  const ServiceAccountNotEmpty = await checkInputNotEmpty(
    page,
    'Service account*'
  );
  const PrimaryNetworkNotEmpty = await checkInputNotEmpty(
    page,
    'Primary network'
  );
  const SubNetworkNotEmpty = await checkInputNotEmpty(page, 'Sub network');

  const allFieldsFilled =
    jobNameNotEmpty &&
    regionNotEmpty &&
    MachinetypeNotEmpty &&
    // AcceleratortypeNotEmpty &&
    // AcceleratorcountNotEmpty &&
    KernelNotEmpty &&
    CloudStorageBucketNotEmpty &&
    DisktypeNotEmpty &&
    DisksizeNotEmpty &&
    ServiceAccountNotEmpty &&
    PrimaryNetworkNotEmpty &&
    SubNetworkNotEmpty;

  return allFieldsFilled;
}

/**
 * Helper function to create a job scheduler.
 * @param {Object} page - Playwright page object.
 * @param {string} scheduleType - Type of the job scheduler
 */
async function createJobScheduler(
  page: any,
  scheduleType: 'Run now' | 'Run on a schedule'
) {
  const filebrowser = page.locator("//li[@title='Google Cloud Storage']");
  if ((await filebrowser.count) > 0) {
    await page.getByTitle('File Browser (Ctrl+Shift+F)').click();
    await page.locator("(//div[@class='jp-DirListing-header'])[2]").click();
    await page
      .locator(
        "(//div[contains(@class,'jp-DirListing-headerItem jp-id-name')])[2]"
      )
      .click();
  }
  // await page.getByRole('region', { name: 'notebook content' }).click();
  // const locator = page.locator('.jp-LauncherCard:visible', {
  //   hasText: 'Python 3 (ipykernel)'
  // });
  const locator = page.locator(
    '(//*[@data-category="Notebook" and @title="Python 3 (ipykernel)"])[1]',
    {
      hasText: 'Python 3 (ipykernel)'
    }
  );
  if ((await locator.count()) > 0) {
    await locator.first().click();
    await page
      .getByLabel('Untitled.ipynb')
      .getByTitle('Job Scheduler')
      .getByRole('button')
      .click();
    await page.getByLabel('Job name*').clear();
    await page.getByLabel('Job name*').fill(`test-${dateTimeStr}`);
    await page.getByLabel('Disk Size (in GB)').fill('50');

    const dropdownFields = [
      'Machine type*',
      'Accelerator type',
      'Accelerator count*',
      'Kernel*',
      'Cloud Storage Bucket*',
      'Disk Type',
      'Primary network',
      'Sub network'
    ];
    for (const label of dropdownFields) {
      await page.getByLabel(label).click();
      await page.getByRole('option').first().click();
    }

    if (scheduleType === 'Run now') {
      await page.getByLabel('Run now').click();
    }

    if (scheduleType === 'Run on a schedule') {
      await page.getByLabel('Run on a schedule').click();
    }

    const AcceleratortypeNotEmpty = await checkInputNotEmpty(
      page,
      'Accelerator type'
    );
    const AcceleratorcountNotEmpty = await checkInputNotEmpty(
      page,
      'Accelerator count*'
    );

    if (
      AcceleratorcountNotEmpty &&
      AcceleratortypeNotEmpty &&
      (await checkInputFieldsNotEmpty(page))
    ) {
      await expect(page.getByLabel('Create Schedule')).not.toBeDisabled();
      await page.getByLabel('Create Schedule').click();
      await expect(
        page.getByText('Job scheduler successfully created')
      ).toBeVisible();
    } else {
      await expect(page.getByLabel('Create Schedule')).toBeDisabled();
    }
  }
}

/**
 * Helper function to validate field error visibility and resolution.
 * @param {Object} page - Playwright page object.
 * @param {string} fieldLabel - Label of the field to validate.
 * @param {string} errorMessage - Error message to check visibility.
 * @param {boolean} isDropdown - Whether the field is a dropdown (default: false).
 * @param {string} [dropdownOption] - Option to select if field is a dropdown.
 */
async function validateErrorResolution(
  page: Page,
  fieldLabel: string,
  errorMessage: string,
  isDropdown = false,
  dropdownOption = ''
) {
  // Clear the field
  await page.getByLabel(fieldLabel).clear();

  // Ensure the error message is visible
  await expect(page.getByText(errorMessage)).toBeVisible();

  // Interact with the field based on its type
  const field = page.getByLabel(fieldLabel);
  if (isDropdown) {
    await field.click();
    if (dropdownOption) {
      await page.getByRole('option', { name: dropdownOption }).click();
    } else {
      await page.getByRole('option').first().click();
    }
  } else {
    await field.click();
    await field.fill('test-' + dateTimeStr); // Fill with a placeholder value
  }

  // Verify the error message is no longer visible
  await expect(page.getByText(errorMessage)).toBeHidden();
}

test.describe('VTX-25:Vertex scheduling jobs', () => {
  test('VTX-14,VTX-15,VTX-27,VTX-28:Can create a job scheduler with Run now', async ({
    page
  }) => {
    test.setTimeout(timeout);
    await createJobScheduler(page, 'Run now');
  });

  test('VTX-26,VTX-27,VTX-28:Can create a job scheduler with Run on a schedule', async ({
    page
  }) => {
    test.setTimeout(timeout);
    await createJobScheduler(page, 'Run on a schedule');
  });

  test('VTX-29:Cancel job creation', async ({ page }) => {
    test.setTimeout(150 * 1000);
    let clusterNotEmpty = true;

    const filebrowser = await page
      .locator("//li[@title='Google Cloud Storage']")
      .count();
    if (filebrowser > 0) {
      await page.getByTitle('File Browser (Ctrl+Shift+F)').click();
      await page.locator("(//div[@class='jp-DirListing-header'])[2]").click();
      await page
        .locator(
          "(//div[contains(@class,'jp-DirListing-headerItem jp-id-name')])[2]"
        )
        .click();
    }

    // Navigate to the notebook content region
    // await page.getByRole('region', { name: 'notebook content' }).click();

    // Locate and select the Python 3 kernel card
    // const locator = page.locator('.jp-LauncherCard:visible', {
    //   hasText: 'Python 3 (ipykernel)'
    // });
    const locator = page.locator(
      '(//*[@data-category="Notebook" and @title="Python 3 (ipykernel)"])[1]',
      {
        hasText: 'Python 3 (ipykernel)'
      }
    );
    const count = await locator.count();
    expect(count).toBeGreaterThan(0);
    if (count > 0) {
      await locator.first().click();
      await page
        .getByLabel('Untitled.ipynb')
        .getByTitle('Job Scheduler')
        .getByRole('button')
        .click();

      // Fill in the required fields in the Job Scheduler form
      await page.getByLabel('Job name*').click();
      await page.getByLabel('Job name*').fill('test-' + dateTimeStr);
      await page.getByLabel('Disk Size (in GB)').click();
      await page.getByLabel('Disk Size (in GB)').fill('50');

      // Select the first available option for dropdown fields
      const dropdownFields = [
        'Machine type*',
        'Accelerator type',
        'Accelerator count*',
        'Kernel*',
        'Cloud Storage Bucket*',
        'Disk Type',
        'Primary network',
        'Sub network'
      ];

      for (const label of dropdownFields) {
        await page.getByLabel(label).click();
        await page.getByRole('option').first().click();
      }

      const inputfields = await checkInputFieldsNotEmpty(page);

      if (inputfields) {
        await expect(page.getByLabel('cancel Batch')).toBeEnabled();
        await page.getByLabel('cancel Batch').click();
        // await expect(page).toHaveTitle(/ipynb/);
        await expect(
          page.locator(
            '//li[@aria-selected="true" and contains(@title,".ipynb")]'
          )
        ).toBeVisible();
      }
    }
  });

  test('VTX-11,VTX-12,VTX-13:Create new bucket', async ({ page }) => {
    test.setTimeout(150 * 1000);
    let clusterNotEmpty = true;

    const filebrowser = await page
      .locator("//li[@title='Google Cloud Storage']")
      .count();
    if (filebrowser > 0) {
      await page.getByTitle('File Browser (Ctrl+Shift+F)').click();
      await page.locator("(//div[@class='jp-DirListing-header'])[2]").click();
      await page
        .locator(
          "(//div[contains(@class,'jp-DirListing-headerItem jp-id-name')])[2]"
        )
        .click();
    }

    // Navigate to the notebook content region
    // await page.getByRole('region', { name: 'notebook content' }).click();

    // Locate and select the Python 3 kernel card
    // const locator = page.locator('.jp-LauncherCard:visible', {
    //   hasText: 'Python 3 (ipykernel)'
    // });
    const locator = page.locator(
      '(//*[@data-category="Notebook" and @title="Python 3 (ipykernel)"])[1]',
      {
        hasText: 'Python 3 (ipykernel)'
      }
    );
    const count = await locator.count();
    expect(count).toBeGreaterThan(0);
    if (count > 0) {
      await locator.first().click();
      await page
        .getByLabel('Untitled.ipynb')
        .getByTitle('Job Scheduler')
        .getByRole('button')
        .click();

      // Create new bucket
      await page.getByLabel('Cloud Storage Bucket*').clear();

      // Generate new bucket name
      const bucketName = 'scheduler-jupyter-extension-' + dateTimeStr;
      console.log(bucketName);

      // Enter new bucket name
      await page.getByLabel('Cloud Storage Bucket*').fill(bucketName);
      //const option = 'Create and Select "' + bucketName + '"';

      // Check user gets option to create & select new bucket
      await expect(
        page.getByText(`Create and Select "${bucketName}"`)
      ).toBeVisible();

      // Create and select new bucket from dropdown
      await page.getByText(`Create and Select "${bucketName}"`).click();
      await expect(
        page.getByText('Select an existing bucket or create a new one.')
      ).toBeVisible();
      await page.getByRole('progressbar').nth(2).waitFor({ state: 'detached' });
      await page.getByLabel('Cloud Storage Bucket*').click();
      await page
        .getByRole('option', { name: bucketName })
        .waitFor({ state: 'attached' });
      await expect(
        page.getByRole('option', { name: bucketName })
      ).toBeVisible();
      await page.getByRole('option', { name: bucketName }).click();
      await expect(page.getByLabel('Cloud Storage Bucket*')).toHaveValue(
        bucketName
      );
    }
  });

  test('CMP-01,VTX-01,VTX-03,VTX-04,VTX-05,VTX_06,VTX-07,VTX-08,VTX-09,VTX-10,VTX-16,VTX-17,VTX-18,VTX-19,VTX-20,VTX-21,VTX-22,VTX-23,VTX-24,VTX-30,VTX-31:Sanity: can perform field validation', async ({
    page
  }) => {
    test.setTimeout(150 * 1000);

    const filebrowser = await page
      .locator("//li[@title='Google Cloud Storage']")
      .count();
    if (filebrowser > 0) {
      await page.getByTitle('File Browser (Ctrl+Shift+F)').click();
      await page.locator("(//div[@class='jp-DirListing-header'])[2]").click();
      await page
        .locator(
          "(//div[contains(@class,'jp-DirListing-headerItem jp-id-name')])[2]"
        )
        .click();
    }

    // Navigate to the notebook content
    // await page.getByRole('region', { name: 'notebook content' }).click();

    // Locate and select the Python 3 kernel card
    // const kernelCard = page.locator('.jp-LauncherCard:visible', {
    //   hasText: 'Python 3 (ipykernel)'
    // });
    const kernelCard = page.locator(
      '(//*[@data-category="Notebook" and @title="Python 3 (ipykernel)"])[1]',
      {
        hasText: 'Python 3 (ipykernel)'
      }
    );
    const kernelCount = await kernelCard.count();
    expect(kernelCount).toBeGreaterThan(0);

    if (kernelCount > 0) {
      await kernelCard.first().click();

      // Step 3: Open Job Scheduler dialog
      await page
        .getByLabel('Untitled.ipynb')
        .getByTitle('Job Scheduler')
        .getByRole('button')
        .click();

      await page.waitForTimeout(20000);

      // Validate fields and behavior
      await expect(page.getByLabel('Vertex')).toBeVisible();
      await expect(page.getByLabel('Vertex')).toHaveAttribute('checked', '');
      await expect(page.getByLabel('Composer')).toBeVisible();
      await expect(page.getByLabel('Composer')).not.toBeChecked();

      // Check default value of cloud storage bucket
      const CloudStorageBucketName = await page
        .getByLabel('Cloud Storage Bucket*')
        .innerText();
      await expect(page.getByLabel('Cloud Storage Bucket*')).toHaveValue(
        'default-vertex-schedules'
      );

      // Validate all errors and resolve them
      const fieldsToValidate = [
        { label: 'Job name*', error: 'Name is required', isDropdown: false },
        {
          label: 'Region*',
          error: 'Region is required',
          isDropdown: true,
          dropdownOption: 'us-central1'
        },
        {
          label: 'Machine type*',
          error: 'Machine type is required',
          isDropdown: true
        },
        { label: 'Kernel*', error: 'Kernel is required', isDropdown: true },
        {
          label: 'Cloud Storage Bucket*',
          error: 'Cloud storage bucket is required',
          isDropdown: true
        }
        // {
        //   label: 'Primary network*',
        //   error: 'Primary network is required',
        //   isDropdown: true
        // },
        // {
        //   label: 'Sub network*',
        //   error: 'Sub network is required',
        //   isDropdown: true
        // }
      ];

      for (const field of fieldsToValidate) {
        await validateErrorResolution(
          page,
          field.label,
          field.error,
          field.isDropdown,
          field.dropdownOption
        );
      }

      await page.getByLabel('Accelerator type').click();
      await page.getByRole('option').first().click();
      await expect(page.getByLabel('Accelerator count*')).toBeVisible();
      await expect(
        page.getByText('Accelerator count is required')
      ).toBeVisible();
      await page.getByLabel('Accelerator count*').click();
      await page.getByRole('option').first().click();
      await expect(
        page.getByText('Accelerator count is required')
      ).toBeHidden();

      // Check input file field is  disabled
      await expect(page.locator('//input[@disabled]').first()).toBeDisabled();

      // Check default value of service account
      const ServiceAccountName = await page
        .getByLabel('Service account*')
        .innerText();
      await expect(page.getByLabel('Service account*')).toHaveValue(
        'Compute Engine default service account'
      );

      // Network Configuration
      await expect(page.getByLabel('Network in this project')).toBeVisible();
      await expect(
        page.getByLabel('Network shared from host project')
      ).toBeVisible();
      await expect(page.getByLabel('Network in this project')).toHaveAttribute(
        'checked',
        ''
      );
      await expect(
        page.getByLabel('Network shared from host project')
      ).not.toBeChecked();
      await page.getByLabel('Network shared from host project').click();
      await expect(page.getByLabel('Shared subnetwork*')).toBeVisible();

      // Schedule configuration
      await page.getByLabel('Run on a schedule').click();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^Start Date$/ })
          .getByPlaceholder('MM/DD/YYYY hh:mm aa')
      ).toBeVisible();
      await expect(
        page
          .locator('div')
          .filter({ hasText: /^End Date$/ })
          .getByPlaceholder('MM/DD/YYYY hh:mm aa')
      ).toBeVisible();
      await expect(page.getByLabel('Schedule*')).toBeVisible();
      await expect(page.getByText('Schedule field is required')).toBeVisible();
      await expect(page.getByLabel('Time Zone*')).toBeVisible();
      await expect(page.getByLabel('Time Zone*')).not.toBeEmpty();
      await expect(page.getByLabel('Max runs')).toBeVisible();
    }
  });
});

// Function to get the first job that has a specific action enabled
async function getJobWithAction(page: any, action: string) {
  // Check list of jobs are displayed
  const tableLocator = page.locator('//table[@class="clusters-list-table"]');
  if (await tableLocator.isVisible()) {
    const jobRows = page.locator('//tr[@class="cluster-list-data-parent"]');
    const noOfJobs = await jobRows.count();

    for (let i = 0; i < noOfJobs; i++) {
      const actionIcon = jobRows.nth(i).locator(`//div[@title="${action}"]`);
      if ((await actionIcon.isVisible()) && (await actionIcon.isEnabled())) {
        return jobRows.nth(i);
      }
    }
    return null;
  } else {
    await expect(page.getByText('No rows to display')).toBeVisible();
    return null;
  }
}

test.describe('Vertex scheduling jobs listing page', () => {
  test('VTX-32,VTX-33,VTX-35,VTX-36,VTX-37,VTX-38,VTX-39,VTX-40,VTX-41,VTX-42 :Sanity: Can verify fields on the page', async ({
    page
  }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    // Validate fields and behavior
    await expect(page.getByLabel('Vertex')).toBeVisible();
    await expect(page.getByLabel('Vertex')).toBeChecked();
    await expect(page.getByLabel('Composer')).toBeVisible();
    await expect(page.getByLabel('Composer')).not.toBeChecked();

    const regionField = page.getByLabel('Region*');
    await expect(regionField).toBeVisible();
    await regionField.clear();
    await regionField.click();
    await page.getByTestId('ArrowDropDownIcon').click();
    await expect(page.getByText('Region is required')).toBeVisible();
    await regionField.click();
    await page.getByRole('option', { name: 'us-central1' }).click();
    await expect(page.getByText('Region is required')).toBeHidden();
    await expect(page.getByLabel('cancel Batch')).toBeVisible();

    // Check list of jobs are displayed
    const tableExists = await page
      .locator('//table[@class="clusters-list-table"]')
      .isVisible();
    if (tableExists) {
      const headers = [
        'Schedule Name',
        'Frequency',
        'Next Run Date',
        'Created',
        'Latest Execution Jobs',
        'Status',
        'Actions'
      ];
      for (const header of headers) {
        await expect(
          page.getByRole('columnheader', { name: header, exact: true })
        ).toBeVisible();
      }
      const rowCount = await page
        .locator('//table[@class="clusters-list-table"]//tr')
        .count();
      expect(rowCount).toBeGreaterThan(0);
    } else {
      await expect(page.getByText('No rows to display')).toBeVisible();
    }
  });

  test('VTX-34 :Refresh listing screen', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    await expect(page.getByLabel('cancel Batch')).toBeVisible();
    await page.getByLabel('cancel Batch').click();
    //await expect(page.getByText('Loading Vertex Schedules')).toBeVisible();
    await page
      .getByText('Loading Vertex Schedules')
      .waitFor({ state: 'hidden' });
    await page.locator('//table[@class="clusters-list-table"]').isVisible();
  });

  test('Check if job is active or completed or paused', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    // Check the job status
    const tableExists = await page
      .locator('//table[@class="clusters-list-table"]')
      .isVisible();
    if (tableExists) {
      const parentLocator = page.locator(
        '//tr[@class="cluster-list-data-parent"]'
      );
      const noOfRows = await parentLocator.count();
      for (let i = 0; i < noOfRows; i++) {
        const status = await parentLocator
          .nth(i)
          .locator('//td[@role="cell"][6]')
          .innerText();

        //check status column text
        expect(['ACTIVE', 'COMPLETED', 'PAUSED']).toContainEqual(status);
        break;
      }
    } else {
      await expect(page.getByText('No rows to display')).toBeVisible();
    }
  });

  test('Check if the job is created to run once or on a schedule', async ({
    page
  }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    const parentLocator = page.locator(
      '//tr[@class="cluster-list-data-parent"]'
    );
    const noOfClusters = await parentLocator.count();
    for (let i = 0; i < noOfClusters; i++) {
      const schedulecol = await parentLocator
        .nth(i)
        .locator('//td[@role="cell"][2]')
        .innerText();
      //check schedule column text
      await ScheduleText(schedulecol);
      break;
    }
    //check schedule column text
    async function ScheduleText(schedulecol: string) {
      if (schedulecol == 'Run Once') {
        console.log('job is created for ' + schedulecol);
      } else {
        console.log('job is created for ' + schedulecol);
      }
    }
  });

  test('VTX-43,VTX-53,VTX-54:Pause a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    const jobLocator = await getJobWithAction(page, 'Pause');
    if (jobLocator) {
      const jobName = await jobLocator
        .locator('//td[@role="cell"][1]')
        .innerText();
      console.log(`Pausing job: ${jobName}`);
      const msg = 'Schedule ' + jobName + ' updated successfully';

      await jobLocator.locator('//div[@title="Pause"]').click();
      await page.getByRole('progressbar').nth(1).waitFor({ state: 'detached' });
      await jobLocator.getByText('ACTIVE').waitFor({ state: 'detached' });
      await expect(jobLocator.getByText('PAUSED')).toBeVisible();
      // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
      await expect(
        page.locator(
          '(//div[@role="alert"and @class="Toastify__toast-body"])[1]'
        )
      ).toContainText(msg);
    } else {
      console.log('No job available to pause.');
    }
  });

  test('VTX-44,VTX-53,VTX-54:Resume a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    const jobLocator = await getJobWithAction(page, 'Resume');
    if (jobLocator) {
      const jobName = await jobLocator
        .locator('//td[@role="cell"][1]')
        .innerText();
      console.log(`Resuming job: ${jobName}`);
      const msg = 'Schedule ' + jobName + ' updated successfully';

      await jobLocator.locator('//div[@title="Resume"]').click();
      await page.getByRole('progressbar').nth(1).waitFor({ state: 'detached' });
      await jobLocator.getByText('PAUSED').waitFor({ state: 'detached' });
      await expect(jobLocator.getByText('ACTIVE')).toBeVisible();
      // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
      await expect(
        page.locator(
          '(//div[@role="alert"and @class="Toastify__toast-body"])[1]'
        )
      ).toContainText(msg);
    } else {
      console.log('No job available to resume.');
    }
  });

  test('VTX-45,VTX-54:Trigger a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    const jobLocator = await getJobWithAction(page, 'Trigger the job');
    if (jobLocator) {
      const jobName = await jobLocator
        .locator('//td[@role="cell"][1]')
        .innerText();
      const triggerMessage = `${jobName} triggered successfully`;
      console.log(`Triggering job: ${jobName}`);

      await jobLocator.locator('//div[@title="Trigger the job"]').click();
      await page.getByRole('progressbar').nth(1).waitFor({ state: 'detached' });
      // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
      await expect(
        page.locator(
          '(//div[@role="alert" and @class="Toastify__toast-body"])[1]'
        )
      ).toContainText(triggerMessage);
    } else {
      console.log('No job available to trigger.');
    }
  });

  test('VTX-46,VTX-47,VTX-54:Edit a schedule', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    const jobLocator = await getJobWithAction(page, 'Edit Schedule');

    if (jobLocator) {
      const jobName = await jobLocator
        .locator('//td[@role="cell"][1]')
        .innerText();
      const msg = 'Job ' + jobName + ' successfully updated';

      await jobLocator.locator('//div[@title="Edit Schedule"]').click();
      await page.getByRole('progressbar').nth(1).waitFor({ state: 'detached' });
      await page.waitForTimeout(10000);
      //validate disabled fields
      await expect(page.getByLabel('Job name*')).toBeDisabled();
      await expect(page.getByLabel('Input file*')).toBeDisabled();
      await expect(page.getByLabel('Region*')).toBeDisabled();
      await expect(page.getByLabel('Primary network')).toBeDisabled();
      await expect(page.getByLabel('Sub network')).toBeDisabled();
      await expect(page.getByLabel('Composer')).toBeDisabled();
      await expect(
        page.getByLabel('Network shared from host project')
      ).toBeDisabled();

      // update disk size
      await page.getByLabel('Disk Size (in GB)').click();
      await page.getByLabel('Disk Size (in GB)').clear();
      await page.getByLabel('Disk Size (in GB)').fill('200');

      // Validate that input fields are not empty
      const inputfields = await checkInputFieldsNotEmpty(page);
      const StartDateNotEmpty = await page
        .locator('div')
        .filter({ hasText: /^Start Date$/ })
        .getByPlaceholder('MM/DD/YYYY hh:mm aa');
      const EndDateNotEmpty = await page
        .locator('div')
        .filter({ hasText: /^End Date$/ })
        .getByPlaceholder('MM/DD/YYYY hh:mm aa');
      const ScheduleNotEmpty = await checkInputNotEmpty(page, 'Schedule*');
      const TimeZoneNotEmpty = await checkInputNotEmpty(page, 'Time Zone*');
      const AcceleratortypeNotEmpty = await checkInputNotEmpty(
        page,
        'Accelerator type'
      );
      let acceleratorcountpresent;
      if (AcceleratortypeNotEmpty) {
        const AcceleratorcountNotEmpty = await checkInputNotEmpty(
          page,
          'Accelerator count*'
        );
        return acceleratorcountpresent;
      }
      let acceleratorFieldsFilled;
      if (AcceleratortypeNotEmpty && acceleratorcountpresent) {
        return acceleratorFieldsFilled;
      }

      const scheduleFieldsFilled =
        StartDateNotEmpty &&
        //EndDateNotEmpty &&
        ScheduleNotEmpty &&
        TimeZoneNotEmpty &&
        acceleratorFieldsFilled;

      // click update
      if (!scheduleFieldsFilled && !inputfields) {
        await expect(page.getByLabel(' Update Schedule')).toBeDisabled();
      } else {
        await expect(page.getByLabel(' Update Schedule')).not.toBeDisabled();
        await page.getByLabel(' Update Schedule').click();
      }
      // verify schedule updated
      // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
      await expect(
        page.locator(
          '(//div[@role="alert"and @class="Toastify__toast-body"])[1]'
        )
      ).toContainText(msg);
    } else {
      console.log('No job available to update.');
    }
  });

  test('VTX-48:Cancel Edit schedule', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    const jobLocator = await getJobWithAction(page, 'Edit Schedule');

    if (jobLocator) {
      await jobLocator.locator('//div[@title="Edit Schedule"]').click();
      await page.getByRole('progressbar').nth(1).waitFor({ state: 'detached' });
      await page.waitForTimeout(10000);
      // update disk size
      await page.getByLabel('Disk Size (in GB)').click();
      await page.getByLabel('Disk Size (in GB)').clear();
      await page.getByLabel('Disk Size (in GB)').fill('20');

      // Validate that input fields are not empty
      const inputfields = await checkInputFieldsNotEmpty(page);
      const StartDateNotEmpty = await page
        .locator('div')
        .filter({ hasText: /^Start Date$/ })
        .getByPlaceholder('MM/DD/YYYY hh:mm aa');
      const EndDateNotEmpty = await page
        .locator('div')
        .filter({ hasText: /^End Date$/ })
        .getByPlaceholder('MM/DD/YYYY hh:mm aa');
      const ScheduleNotEmpty = await checkInputNotEmpty(page, 'Schedule*');
      const TimeZoneNotEmpty = await checkInputNotEmpty(page, 'Time Zone*');

      const scheduleFieldsFilled =
        StartDateNotEmpty &&
        //EndDateNotEmpty &&
        ScheduleNotEmpty &&
        TimeZoneNotEmpty;

      // click cancel
      if (scheduleFieldsFilled) {
        await expect(page.getByLabel('cancel Batch')).not.toBeDisabled();
        await page.getByLabel('cancel Batch').click();
      }

      // verify schedule not updated
      await page
        .getByText('Loading Vertex Schedules')
        .waitFor({ state: 'detached' });
      await expect(
        page.locator('//div[@class="cluster-details-title"]')
      ).toBeVisible();
      await page.locator('//table[@class="clusters-list-table"]').isVisible();
    } else {
      console.log('No job available to update.');
    }
  });

  test('VTX-50,VTX-51,VTX-52,VTX-54:Delete a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);

    const jobLocator = await getJobWithAction(page, 'Delete');
    if (jobLocator) {
      const jobName = await jobLocator
        .locator('//td[@role="cell"][1]')
        .innerText();
      console.log(`Deleting job: ${jobName}`);

      await jobLocator.locator('//div[@title="Delete"]').click();
      await expect(
        page.getByText(`This will delete ${jobName} and cannot be undone.`)
      ).toBeVisible();
      await page.getByRole('button', { name: 'Delete' }).click();
      await page.waitForTimeout(5000);
      // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
      await expect(
        page.getByText(
          `Deleted job ${jobName}. It might take a few minutes for the job to be deleted from the list of jobs.`
        )
      ).toBeVisible();

      // Verify deleted job is not coming back after refresh
      await page.getByLabel('cancel Batch').click();
      await expect(page.getByText('Loading Vertex schedulers')).toBeVisible();
      await page
        .getByText('Loading Vertex Schedules')
        .waitFor({ state: 'hidden' });
      await page.locator('//table[@class="clusters-list-table"]').isVisible();
      await expect(jobLocator.locator('//td[@role="cell"][1]')).not.toEqual(
        jobName
      );
    } else {
      console.log('No job available to delete.');
    }
  });
});

// Helper to navigate to the Execution History page for the first job
async function navigateToExecutionHistory(page: Page) {
  const jobName = await page.getByRole('cell').first().innerText();
  await page.getByRole('cell').first().click();
  await page.getByText('Loading History').waitFor({ state: 'detached' });
  await page
    .getByText('Loading Dag Runs Task Instances')
    .waitFor({ state: 'detached' });
  return jobName;
}

test.describe('Vertex scheduling jobs execution history', () => {
  test('VTX-55,VTX-56,VTX-57,VTX-58,VTX-59,VTX-60,VTX-61,VTX-62, :Sanity: can verify execution history page', async ({
    page
  }) => {
    test.setTimeout(150 * 1000);

    await navigateToScheduleJobsListingPage(page);

    const listingTableExists = await page
      .locator('//table[@class="clusters-list-table"]')
      .isVisible();
    if (listingTableExists) {
      const jobName = await navigateToExecutionHistory(page);

      // Verify job name is displayed
      await expect(
        page.getByText('Execution History: ' + jobName)
      ).toBeVisible();

      // Verify logs button is displayed
      await expect(
        page.locator(
          '//div[@class="execution-history-main-wrapper" and @role="button"]'
        )
      ).toBeVisible();
      await expect(
        page.locator(
          '//div[@class="execution-history-main-wrapper" and @role="button"]'
        )
      ).toBeEnabled();

      // Verify current date is selected
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, '0');
      const date = `${pad(now.getDate())}`;
      const selecteddate = await page
        .locator('//button[@aria-current]')
        .innerText();
      console.log(selecteddate);
      const length = selecteddate.length;
      if (length == 1) {
        const date2 = '0' + selecteddate;
        await expect(date2).toContain(date);
      } else {
        await expect(selecteddate).toContain(date);
      }
      // Verify future dates are disabled
      await expect(
        page.locator('(//button[@aria-current]/following::button)[1]')
      ).toBeDisabled();

      // Check table headers if table data is present
      const historyDataExists = await page
        .locator('//table[@class="clusters-list-table"]')
        .isVisible();
      if (historyDataExists) {
        const headers = [
          'State',
          'Date',
          'Time',
          'Code',
          'Status Message',
          'Actions'
        ];
        for (const header of headers) {
          await expect(
            page.getByRole('columnheader', { name: header, exact: true })
          ).toBeVisible();
        }

        const rowCount = await page
          .locator('//tbody[@role="rowgroup"]')
          .count();
        //expect(rowCount).toBeGreaterThanOrEqual(1);
        if (rowCount > 0) {
          console.log('Logs are displayed');
        } else {
          await expect(page.getByText('No rows to display')).toBeVisible();
          console.log('No warnings or errors are displayed');
        }
      } else {
        await expect(page.getByText('No rows to display')).toBeVisible();
        console.log('History data is unavailable');
      }
    } else {
      await expect(page.getByText('No rows to display')).toBeVisible();
      console.log('No jobs are displayed on the listing page');
    }
  });

  test('VTX-63,VTX-64,VTX-65,VTX-66 :Can download output from execution history page', async ({
    page
  }) => {
    test.setTimeout(150 * 1000);

    await navigateToScheduleJobsListingPage(page);
    const listingTableExists = await page
      .locator('//table[@class="clusters-list-table"]')
      .isVisible();
    if (listingTableExists) {
      const jobName = await navigateToExecutionHistory(page);

      const historyDataExists = await page
        .locator('//table[@class="clusters-list-table"]')
        .isVisible();
      if (historyDataExists) {
        // Check the status and download the output
        const status = await page
          .locator('//tr[@class="cluster-list-data-parent"][1]/td[1]')
          .first()
          .innerText();

        if (status === 'Succeeded') {
          await page
            .getByRole('button', { name: 'Download Output' })
            .first()
            .click();

          // Check the confiramtion message
          await page.getByRole('progressbar').waitFor({ state: 'detached' });
          // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
          // await expect(page.getByText(jobName + ` job history downloaded successfully`)).toBeVisible();
          await expect(
            page.getByText(
              '.ipynb has been successfully downloaded from the ' +
                jobName +
                ` job history`
            )
          ).toBeVisible();
        } else {
          const downloadButtonClass = await page
            .getByRole('button', { name: 'Download Output' })
            .first()
            .getAttribute('class');

          // Verify the download button is disabled
          expect(downloadButtonClass).toContain('disable');

          // Ensure the status is failed or penging oe running
          expect(['Failed', 'pending', 'running']).toContainEqual(status);
        }
      } else {
        await expect(page.getByText('No rows to display')).toBeVisible();
        console.log('History data is unavailable');
      }
    } else {
      await expect(page.getByText('No rows to display')).toBeVisible();
      console.log('No jobs are displayed on the listing page');
    }
  });
});
