import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../components/user/user.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './support.html',
  styleUrls: ['./support.css']
})



export class SupportComponent implements OnInit {
  loading = false;
  loading_followup = false;
  totalTickets = 0;
  newTicketTitle = '';
  newTicketContent = '';
  newTicketFiles: File[] = [];

  isRotated = false;
  tickets: any[] = [];
  requestTypes: any[] = [];
  followups: { [ticketId: number]: any[] } = {};
  newFollowupContent: { [ticketId: number]: string } = {};
  followupFiles: { [ticketId: number]: File[] } = {};
  filePreviews: { [ticketId: number]: { file: File; url: string }[] } = {};
  documents: { [ticketId: number]: any[] } = {};

  expandedTicketId: number | null = null;

  currentPage: number = 1;
  itemsPerPage: number = 10;
  filterByType: number = 1;
  filterByStatus: string = "null";
  totalPages: number = 1;
  totalPagesArray: number[] = [];

  sortColumn: string = 'date';
  sortOrder: 'ASC' | 'DESC' = 'DESC';
  
  constructor(private http: HttpClient, private UserService: UserService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    const params = new HttpParams()
      .set('email', this.UserService.getEmail())
      .set('page', this.currentPage.toString())
      .set('limit', this.itemsPerPage.toString())
      .set('type', this.filterByType) // 1 = incident, 2 = demand
      .set('status', this.filterByStatus) // 0 = in_progress, 1 = closed
      .set('order', this.sortOrder);

    this.http.get<any>('http://localhost:3000/api/tickets', { observe: 'response', params }).subscribe({
      next: (res) => {
        this.tickets = res.body.tickets;
        this.totalTickets = res.body.total;
        this.totalPages = Math.ceil(this.totalTickets / this.itemsPerPage);
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.tickets.forEach(ticket => this.loadDocumentsForTicket(ticket.id));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tickets:', err);
        this.loading = false;
      }
    });
    }
  
  loadDocumentsForTicket(ticketId: number): void {
    const email = this.UserService.getEmail();
    const params = new HttpParams().set('email', email || '');
    this.http.get<any>(
      `http://localhost:3000/api/tickets/${ticketId}/documents`,
      { params }
    ).subscribe({
      next: (res) => {
        this.documents = this.documents || {};
        this.documents[ticketId] = res.documents;
      },
      error: (err) => console.error(`Error loading documents for ticket ${ticketId}:`, err)
    });
  }

  onPageSelect(selectedPage: number): void {
    if (selectedPage < 1 || selectedPage > this.totalPages) return;
    this.currentPage = selectedPage;
    this.loadTickets();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTickets();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTickets();
    }
  }
  
  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadTickets();
  }

  getRequestTypeName(typeId: number): string {
    const match = this.requestTypes.find(rt => rt.id === typeId);
    return match ? match.name : 'N/A';
  }

  loadFollowups(ticketId: number): void {
    this.loading_followup = true;
    const email = this.UserService.getEmail();
    const params = new HttpParams().set('email', email);
    this.http.get<any>(`http://localhost:3000/api/tickets/${ticketId}`, { params }).subscribe({
      next: (response) => {
        this.followups[ticketId] = response.followups || [];
        this.loading_followup = false;
      },
      error: (err) => {
        console.error(`Error fetching followups for ticket ${ticketId}:`, err); 
        this.loading_followup = false;
      }  
    });
  }

  getSortValue(ticket: any, column: string): string {
    if (column === 'type') return ticket.type === 1 ? 'Incident' : 'Demande';
    if (column === 'status') {
      if (ticket.closedate) return 'Closed';
      if (ticket.solvedate) return 'Resolved';
      return 'In Progress';
    }
    return '';
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
      this.loadTickets();
    } else {
      this.sortColumn = column;
      this.sortOrder = 'ASC';
      this.loadTickets();
    }
  }
  
  sanitize(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  toggleTicketDetails(ticketId: number): void {
    const isExpanding = this.expandedTicketId !== ticketId;
    this.expandedTicketId = isExpanding ? ticketId : null;
    if (isExpanding && !this.followups[ticketId]) this.loadFollowups(ticketId);
  }

  formatContent(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  toggleArrow(): void {
    this.isRotated = !this.isRotated;
  }

  // filter section
  onFilterTypeChanges(): void {
    console.log('Type changed to : ' + this.filterByType)
     if (this.filterByType ==  0) {
      this.filterByStatus = ""
    }
    this.loadTickets();
  }
  onFilterStatusChanges(): void{
    console.log('Type changed to : ' + this.filterByStatus)
    if (this.filterByStatus ==  "") {
      this.filterByType = 0
    }
    console.log('And the type remains : ' + this.filterByType)
    this.loadTickets();
  }

  triggerFileInput(ticketId: number): void {
    const fileInput = document.getElementById(`fileInput-${ticketId}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFollowupFileSelected(event: Event, ticketId: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      const existingFiles = this.followupFiles[ticketId] || [];
      const existingPreviews = this.filePreviews[ticketId] || [];
      this.followupFiles[ticketId] = [...existingFiles, ...newFiles];
      const newPreviews = newFiles.map(file => ({
        file,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
      }));

      this.filePreviews[ticketId] = [...existingPreviews, ...newPreviews];
    }
    (event.target as HTMLInputElement).value = '';
  }

  removeFile(ticketId: number, index: number): void {
    if (this.followupFiles[ticketId]) {
      this.followupFiles[ticketId].splice(index, 1);
    }

    if (this.filePreviews[ticketId]) {
      this.filePreviews[ticketId].splice(index, 1);
    }
  }
  
  closeTicket(ticketId: number): void {
    const body = {
      input: [
        {
          type: 6,
          email: this.UserService.getEmail(),
        }
      ]
    };

      
    this.http.put<any>(
      `http://localhost:3000/api/tickets/${ticketId}`,
      body,
    ).subscribe({
      next: (res: any) => {
        console.log('Ticket closed successfully:', res);
        this.loadTickets()
      },
      error: (err: any) => {
        console.error('Error closing ticket:', err);
      }
    });
  }

  submitFollowup(ticketId: number): void {
    const formData = new FormData();
    const files = this.followupFiles[ticketId] || [];
    const email = this.UserService.getEmail();
    
    formData.append('ticketId', ticketId.toString());
    formData.append('comment', this.newFollowupContent[ticketId] || '');
    formData.append('email', email);

    files.forEach((file, i) => {
      formData.append(`file${i}`, file, file.name);
    });

    this.http.post('http://localhost:3000/api/tickets/add/followup', formData).subscribe({
      next: (res: any) => {
        alert('Follow-up added successfully');
        this.newFollowupContent[ticketId] = '';
        this.followupFiles[ticketId] = [];
        this.filePreviews[ticketId] = [];
        this.loadFollowups(ticketId);
      },
      error: (err: any) => {
        console.error('Failed to add follow-up:', err);
        alert('Error adding follow-up.');
      }
    });
  }
}
