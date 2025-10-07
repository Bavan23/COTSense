import { FileUpload } from "../file-upload";

export default function FileUploadExample() {
  return (
    <div className="max-w-xl p-8">
      <FileUpload onFileSelect={(file) => console.log("File selected:", file.name)} />
    </div>
  );
}
