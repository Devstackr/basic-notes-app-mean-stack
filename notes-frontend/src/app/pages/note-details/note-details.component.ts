import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Note } from 'src/app/shared/note.model';
import { NotesService } from 'src/app/shared/notes.service';
import { Router, ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-note-details',
  templateUrl: './note-details.component.html',
  styleUrls: ['./note-details.component.scss']
})
export class NoteDetailsComponent implements OnInit {

  note: Note;
  new: boolean;
  
  constructor(private notesService: NotesService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {

    // we want find out if we are creating a new note or editing an existing one
    this.route.params.subscribe((params: Params) => {
      this.note = new Note();
      if (params.id) {
        this.notesService.get(params.id).subscribe((note: Note) => {
          this.note = note;
        });
        this.new = false;
      } else {
        this.new = true;
      }
    })
    
  }

  onSubmit(form: NgForm) {
    if (this.new) {
      // we should save the note
      this.notesService.add(form.value).subscribe((newNote) => {
        this.router.navigateByUrl('/');
      })
    } else {
      this.note.title = form.value.title;
      this.note.body = form.value.body;

      this.notesService.update(this.note).subscribe(() => {
        // this code will run once the note has been updated
        this.router.navigateByUrl('/');
      })
    }
  }

  cancel() {
    this.router.navigateByUrl('/');
  }

}
