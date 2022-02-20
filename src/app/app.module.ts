import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { PixieDustDirective } from './pixie-dust.directive';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [AppComponent, PixieDustDirective],
  bootstrap: [AppComponent],
})
export class AppModule {}
