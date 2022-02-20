import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public counter: number = 1000;

  public increment(): void {
    this.counter = this.counter + 100;
  }
}
