import { getDialogApi } from '@i2analyze/notebook-sdk';
import { InitialValue } from './entrypoint';

async function init(): Promise<void> {
  // First, we need to retrieve the dialog API to use its methods and properties.
  const dialogApi = await getDialogApi();

  // Get the initialValue.
  const initialValue: InitialValue = dialogApi.getInitialValue();

  // If the initialValue is available, find the related input fields and assign
  // the corresponding value to each.
  if (initialValue) {
    for (const item of initialValue) {
      const { type, value } = item;

      const inputElement = document.querySelector(
        `input[name=${type.analyzeId}]`
      ) as HTMLInputElement | null;
      if (inputElement) {
        inputElement.value = String(value);
      }
    }
  }

  // Set up event listeners to dynamically control the 'Submit' action,
  // enabling or disabling it based on non-empty values in both the first name and
  // family name input fields.
  const firstNameInput = document.querySelector('input[name="PER4"]') as HTMLInputElement | null;
  const familyNameInput = document.querySelector('input[name="PER6"]') as HTMLInputElement | null;

  if (firstNameInput && familyNameInput) {
    const updateAction = (): void => {
      const isFirstNameValid = firstNameInput.value.trim() !== '';
      const isFamilyNameValid = familyNameInput.value.trim() !== '';

      const config = { enabled: isFirstNameValid && isFamilyNameValid };
      dialogApi.updateAction(dialogApi.systemActions.submit, config);
    };

    firstNameInput.addEventListener('input', updateAction);
    familyNameInput.addEventListener('input', updateAction);

    // Call updateAction initially to set the correct button state
    updateAction();
  }

  // Set up event listeners to capture actions from the dialog, such as Submit or
  // Cancel. If the Submit button is clicked, retrieve the form data, then
  // submit and close the dialog. The retrieved data will be returned as the
  // result of the showDialog function. Otherwise, simply close the dialog.
  dialogApi.addEventListener('action', (actionId: string) => {
    const formElement = document.getElementById('recordForm');
    const isFormElement = formElement instanceof HTMLFormElement;

    if (actionId === dialogApi.systemActions.submit && isFormElement) {
      const formData = new FormData(formElement);
      const entries: [string, string][] = [];

      // Convert FormData to array of entries
      formData.forEach((value, key) => {
        entries.push([key, value.toString()]);
      });

      dialogApi.submitAndClose(entries);
    } else {
      dialogApi.close();
    }
  });
}

void init();
