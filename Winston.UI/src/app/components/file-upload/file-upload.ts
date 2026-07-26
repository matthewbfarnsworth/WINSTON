import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  imports: [],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css',
})
export class FileUpload {
  imageUrl = model<string>('');
  isUploading = input<boolean>(false);
  fileSelected = output<File>();

  protected onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.fileSelected.emit(input.files[0]);
  }
}
