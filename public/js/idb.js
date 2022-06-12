// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// upon upgradeneeded, open an object store
request.onupgradeneeded = function(event) {
  db = event.target.result;
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;
  if (navigator.onLine) {
    console.log('nav is online!')
    uploadTransaction();
  }
};

request.onerror = function(event) {
  console.log(event.target.error);
};

// save to record when the app transaction fails
function saveRecord(record) {
  // create a transaction on the objectStore with readwrite access
  const transaction = db.transaction('new_transaction', 'readwrite');
  //access the objectStore
  const store = transaction.objectStore('new_transaction');
  // add record to the store
  store.add(record);
}

// get record
function uploadTransaction() {
  // open a transaction in the objectStore
  const transaction = db.transaction('new_transaction', 'readwrite');
  // access the objectStore
  const store = transaction.objectStore('new_transaction');
  // get all records from the store
  const getAll = store.getAll();

  console.log(getAll);

  // if getAll is successful, then POST the records
  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(() => {
        // clear indexedDB store after successful POST
        const transaction = db.transaction([ 'new_transaction' ], 'readwrite');

        // access object store
        const store = transaction.objectStore('new_transaction');

        // clear all items in object store
        store.clear();
      });
    }
  };
}

// listen for app online
window.addEventListener('online', uploadTransaction);