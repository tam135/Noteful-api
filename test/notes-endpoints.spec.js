const knex = require('knex');
const app = require('../src/app');
const {makeNotesArray, makeMaliciousNote} = require('./notes-fixtures');
const {makeFoldersArray} = require('./folders-fixtures');

describe('Notes Endpoints', () => {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () =>
    db.raw('TRUNCATE noteful_folder, noteful_note RESTART IDENTITY CASCADE')
  );

  afterEach('cleanup', () =>
    db.raw('TRUNCATE noteful_folder, noteful_note RESTART IDENTITY CASCADE')
  );

  describe(`Unauthorized requests`, () => {
    const testFolders = makeFoldersArray();
    const testNotes = makeNotesArray();

    beforeEach('insert noteful_note', () => {
      return db
        .into('noteful_folder')
        .insert(testFolders)
        .then(() => {
          return db.into('noteful_note').insert(testNotes);
        });
    });

    it(`responds with 401 Unauthorized for GET /api/note`, () => {
      return supertest(app)
        .get('/api/note')
        .expect(401, {error: 'Unauthorized request'});
    });

    it(`responds with 401 Unauthorized for POST /api/note`, () => {
      return supertest(app)
        .post('/api/note')
        .send({name: 'test-name', folder_id: 1, content: 'some test content'})
        .expect(401, {error: 'Unauthorized request'});
    });

    it(`responds with 401 Unauthorized for GET /api/note/:id`, () => {
      const secondNote = testNotes[1];
      return supertest(app)
        .get(`/api/note/${secondNote.id}`)
        .expect(401, {error: 'Unauthorized request'});
    });

    it(`responds with 401 Unauthorized for DELETE /api/note/:id`, () => {
      const aNote = testNotes[1];
      return supertest(app)
        .delete(`/api/note/${aNote.id}`)
        .expect(401, {error: 'Unauthorized request'});
    });

    it(`responds with 401 Unauthorized for PATCH /api/note/:id`, () => {
      const aNote = testNotes[1];
      return supertest(app)
        .patch(`/api/note/${aNote.id}`)
        .send({name: 'updated-name'})
        .expect(401, {error: 'Unauthorized request'});
    });
  });

  describe('GET /api/note', () => {
    context(`Given no notes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/note')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert noteful_note', () => {
        return db
          .into('noteful_folder')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_note').insert(testNotes);
          });
      });

      it('gets the note from the store', () => {
        return supertest(app)
          .get('/api/note')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testNotes);
      });
    });

    context(`Given an XSS attack noteful`, () => {
      const testFolders = makeFoldersArray();
      const {maliciousNote, expectedNote} = makeMaliciousNote();

      beforeEach('insert noteful_note', () => {
        return db
          .into('noteful_folder')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_note').insert([maliciousNote]);
          });
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/note`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].name).to.eql(expectedNote.name);
            expect(res.body[0].content).to.eql(expectedNote.content);
          });
      });
    });
  });
  describe('GET /api/note/:id', () => {
    context(`Given no notes`, () => {
      it(`responds 404 whe note doesn't exist`, () => {
        return supertest(app)
          .get(`/api/note/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: {message: `Note Not Found`},
          });
      });
    });

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert noteful_note', () => {
        return db
          .into('noteful_folder')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_note').insert(testNotes);
          });
      });

      it('responds with 200 and the specified note', () => {
        const noteId = 2;
        const expectedNote = testNotes[noteId - 1];
        return supertest(app)
          .get(`/api/note/${noteId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedNote);
      });
    });

    context(`Given an XSS attack note`, () => {
      const testFolders = makeFoldersArray();
      const {maliciousNote, expectedNote} = makeMaliciousNote();

      beforeEach('insert noteful_note', () => {
        return db
          .into('noteful_folder')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_note').insert([maliciousNote]);
          });
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/note/${maliciousNote.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql(expectedNote.name);
            expect(res.body.content).to.eql(expectedNote.content);
          });
      });
    });
  });

  describe('DELETE /api/note/:id', () => {
    context(`Given no notes`, () => {
      it(`responds 404 whe note doesn't exist`, () => {
        return supertest(app)
          .delete(`/api/note/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: {message: `Note Not Found`},
          });
      });
    });

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert noteful_note', () => {
        return db
          .into('noteful_folder')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_note').insert(testNotes);
          });
      });

      it('removes the note by ID from the store', () => {
        const idToRemove = 2;
        const expectedNotes = testNotes.filter(bm => bm.id !== idToRemove);
        return supertest(app)
          .delete(`/api/note/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/note`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedNotes)
          );
      });
    });
  });
  describe('POST /api/note', () => {
    const testFolders = makeFoldersArray();
    beforeEach('insert testFolders', () => {
      return db.into('noteful_folder').insert(testFolders);
    });
    
    [('name', 'folder_id', 'content')].forEach(field => {
      const newNote = {
        name: 'test-name',
        folder_id: 1,
        content: 'some more test content'
      };

      it(`responds with 400 missing '${field}' if not supplied`, () => {
        delete newNote[field];

        return supertest(app)
          .post(`/api/note`)
          .send(newNote)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {message: `Missing '${field}' in request body`},
          });
      });
    });
  
    it('adds a new note to the store', () => {
      const newNote = {
        name: 'test-name',
        folder_id: 1,
        content: 'test content'
      };
      return supertest(app)
        .post(`/api/note`)
        .send(newNote)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newNote.name);
          expect(res.body.content).to.eql(newNote.content);
          expect(res.body.folder_id).to.eql(newNote.folder_id);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/note/${res.body.id}`);
        })
        .then(res =>
          supertest(app)
            .get(`/api/note/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        );
    });

    it('removes XSS attack content from response', () => {
      const {maliciousNote, expectedNote} = makeMaliciousNote();
      return supertest(app)
        .post(`/api/note`)
        .send(maliciousNote)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(expectedNote.name);
          expect(res.body.content).to.eql(expectedNote.content);
        });
    });
  });
  describe(`PATCH /api/note/:note_id`, () => {
    const testFolders = makeFoldersArray();
    before('insert testFolders', () => {
      return db.into('noteful_folder').insert(testFolders);
    });

    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 123456;
        return supertest(app)
          .patch(`/api/note/${noteId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {error: {message: `Note Not Found`}});
      });
    });

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert noteful_note', () => {
        return db
          .into('noteful_folder')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_note').insert(testNotes);
          });
      });
      
      it('responds with 204 and updates the note', () => {
        const idToUpdate = 2;
        const updateNote = {
          name: 'updated note name',
          folder_id: 1,
          content: 'updated note content',
        };
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote
        };
        return supertest(app)
          .patch(`/api/note/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateNote)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/note/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedNote)
          );
      });
     
      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/note/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({irrelevantField: 'foo'})
          .expect(400, {
            error: {
              message: `Request body must content either 'name', 'folder_id', or 'content'`
            },
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateNote = {
          name: 'updated note name',
        };
      
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote
        };
      
        return supertest(app)
          .patch(`/api/note/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...updateNote,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/note/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedNote)
          );
      });
    });
  });
});
