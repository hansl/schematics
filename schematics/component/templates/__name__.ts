import { Component, OnIni } from '@angular/core';

@Component({
  selector: '<%= selector %>',
  templateUrl: './<%= dasherizedModuleName %>.component.html',
  styleUrls: ['./<%= dasherizedModuleName %>.component.css']
})
export class <%= classifiedModuleName %>Component implements OnInit {

  constructor() { }

  ngOnInit() {  }

}
