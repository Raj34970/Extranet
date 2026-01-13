import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../components/user/user.service';

@Component({
  selector: 'app-createticket',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './createticket.html',
  styleUrl: './createticket.css'
})

export class CreateticketComponent {
  title: string = '';
  description: string = '';
  files: File[] = [];
  filePreviews: { file: File; url: string }[] = [];

  constructor(private http: HttpClient, private UserService: UserService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      this.files.push(...newFiles);

      const newPreviews = newFiles.map(file => ({
        file,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
      }));

      this.filePreviews.push(...newPreviews);
    }
    input.value = '';
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  submit(): void {
    if (!this.title || !this.description) {
      alert('Please fill title and description.');
      return;
    }
    const email = this.UserService.getEmail();
    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('description', this.description);
    formData.append('content', `${this.title}\n\n${this.description}`);
    formData.append('email', email);

    this.files.forEach(file => {
      formData.append('files', file);
    });

    this.http.post('http://localhost:3000/api/tickets/add', formData).subscribe({
      next: () => {
        alert('Ticket created successfully');
        this.title = '';
        this.description = '';
        this.files = [];
        this.filePreviews = [];
      },
      error: (err) => {
        console.error('Failed to create ticket:', err);
        alert('Error creating ticket.');
      }
    });
  }
}
