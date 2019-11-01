/*
TODO: 
- allow editing/removal of nodes
- show node path in title
- add option to save/import notepads (as json file)
*/

//build base model: todo: cleanup
let DefaultNote = {Id: 0, Title: "My Notes", Description:""};
var model = {
    CurrentNote: DefaultNote,
    NoteList: [DefaultNote],
    MaxId: 0
}

if (!localStorage.model)
    localStorage.model = JSON.stringify(model);
else model = JSON.parse(localStorage.model);

var NoteList = new Vue({
    el: "#list",
    data: {
        CurrentNote: model.CurrentNote,
        NoteList: model.NoteList,
        MaxId: model.MaxId
    },
    computed: {
        ChildNotes: function() {
            let children = [];
            this.NoteList.forEach(note =>  {
                if (note.ParentId == this.CurrentNote.Id)
                    children.push(note);
        });
            return children;
        }
    },
    watch: {
        CurrentNote: ()=>{
            NoteList.Save();
            AutoGrow();
        },
        NoteList: ()=>{NoteList.Save()}
    },
    methods: {
        Save: function() {
            localStorage.model = JSON.stringify({
                CurrentNote: this.CurrentNote,
                NoteList: this.NoteList,
                MaxId: this.MaxId
            });
        },
        GetNote: function(noteId) {
            this.NoteList.forEach(note =>  {
                if (note.Id==noteId){
                    this.CurrentNote = note;
                }
            });
        },
        AddNote: function(){
            this.MaxId++;
            this.NoteList.push({ParentId: this.CurrentNote.Id, Id:this.MaxId, Title: "empty", Description: ""});
        },
        DeleteNote: function (noteId) {
            this.NoteList.forEach(note =>  {
                if (note.Id==noteId.toString()){
                    this.NoteList.splice(this.NoteList.indexOf(note), 1);
                }
                if (note.ParentId == noteId.toString()){
                    this.DeleteNote(note.Id);
                }
            });
        },
        Back: function () {
            if (this.CurrentNote.Id != 0)
                this.GetNote(this.CurrentNote.ParentId);
        }
    }    
});

function AutoGrow() {
    setTimeout(() =>{
        let element=document.getElementById("description");
        element.style.height = "5px";
        element.style.height = (element.scrollHeight)+"px";
    },1);
}

AutoGrow();