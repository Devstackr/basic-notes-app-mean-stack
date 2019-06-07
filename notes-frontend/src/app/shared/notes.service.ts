import { Injectable } from '@angular/core';
import { Note } from './note.model';
import { WebRequestService } from './web-request.service';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  constructor(private webReqService: WebRequestService) { }

  getAll() {
    return this.webReqService.get('/notes');
  }

  get(id: string) {
    return this.webReqService.get('/notes/' + id);
  }

  add(note: Note) {
    // this method will add a note to the notes array
    return this.webReqService.post('/notes', note);
  }

  update(note: Note) {
    console.log(note);
    return this.webReqService.patch('/notes/' + note._id, note);
  }

  delete(id: string) {
    return this.webReqService.delete('/notes/' + id);
  }
}
