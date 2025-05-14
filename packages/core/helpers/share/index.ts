import { ShareInput, SharePayload } from '../../types/commands';

const MAX_FILES = 10;
const MAX_TOTAL_SIZE_MB = 50;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

// Helper function to process a single file to base64
const processFile = async (
  file: File,
): Promise<{ name: string; type: string; data: string }> => {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  let binaryString = '';
  const K_CHUNK_SIZE = 0x8000; // 32K chunks

  for (let i = 0; i < uint8Array.length; i += K_CHUNK_SIZE) {
    const chunk = uint8Array.subarray(
      i,
      Math.min(i + K_CHUNK_SIZE, uint8Array.length),
    );
    binaryString += String.fromCharCode.apply(
      null,
      Array.from(chunk), // Convert Uint8Array chunk to number[]
    );
  }

  const base64Data = btoa(binaryString);
  return {
    name: file.name,
    type: file.type,
    data: base64Data,
  };
};

export const formatShareInput = async (
  input: ShareInput,
): Promise<SharePayload> => {
  if (!input.files) {
    return {
      title: input.title,
      text: input.text,
      url: input.url,
    };
  }

  // Ensure input.files is an array if it's truthy
  if (!Array.isArray(input.files)) {
    throw new Error('The "files" property must be an array.');
  }

  if (input.files.length === 0) {
    // Handle case with no files, if navigator.share allows title/text/url sharing without files
    // Or throw an error if files are always required by your use case
    // For now, proceed assuming title/text/url can be shared alone
  } else {
    if (input.files.length > MAX_FILES) {
      throw new Error(`Cannot share more than ${MAX_FILES} files.`);
    }

    let totalSize = 0;
    for (const file of input.files) {
      // Ensure each item in the 'files' array is a File object
      if (!(file instanceof File)) {
        throw new Error(
          `Each item in the 'files' array must be a File object. Received: ${typeof file}`,
        );
      }
      totalSize += file.size; // File.size is in bytes
    }

    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      throw new Error(`Total file size cannot exceed ${MAX_TOTAL_SIZE_MB}MB.`);
    }
  }

  const fileProcessingPromises = input.files.map((file) => processFile(file));
  const processedFiles = await Promise.all(fileProcessingPromises);

  return {
    files: processedFiles,
    title: input.title,
    text: input.text,
    url: input.url,
  };
};
