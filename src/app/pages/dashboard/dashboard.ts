import { Component } from '@angular/core';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';

@Component({
  selector: 'app-dashboard',
  imports: [Header,Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

}
