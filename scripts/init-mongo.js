db = db.getSiblingDB('osintargy');

db.createCollection('tools');
db.createCollection('users');
db.createCollection('categories');
db.createCollection('ratings');

print('OSINTArgy MongoDB initialization complete');
