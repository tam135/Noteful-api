const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeNotesArray, makeMaliciousNote } = require('./notes-fixtures')
const { makeFoldersArray } = require('./folders-fixtures') 

describe('Notes Endpoints', function() {
    let db 

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE noteful_folder, noteful_note RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE noteful_folder, noteful_note RESTART IDENTITY CASCADE'))

    describe(`GET /api/notes`, () => {
        context(`Given no notes`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/note')
                    .expect(200, [])
            })
        })

        context('Given there are notes in the database', () => {
            const testNotes = makeNotesArray()
            const testFolders = makeFoldersArray()

            beforeEach('insert notes', () => {
                return db
                    .into('noteful_folder')
                    .insert(testFolders)
                    .then(() => {
                        return db.into('noteful_note').insert(testNotes)
                    })
            })
            it('responds with 200 and all of the notes', () => {
                return supertest(app)
                    .get('/api/note')
                    .expect(200, testNotes)
            })
        })
        

        
    }) 
  
    
})