let db;
const request = window.indexedDB.open("budget", 1);

request.onsuccess = event => {
    const db = event.target.result;
    console.log(request.result);
    if (navigator.onLine) {
        checkDatabase(db);
    }

    saveRecord();
};
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onerror = function(event) {
    console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
    const db = request.result;
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");

    // access your pending object store
    const store = transaction.objectStore("pending");

    // add record to your store with add method.
    store.add(record);
}

function checkDatabase(db) {
    //  const db = request.result;
    // open a transaction on your pending db
    const transaction = db.transaction(["pending"], "readwrite");
    // access your pending object store
    const store = transaction.objectStore("pending");
    // get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                    method: "POST",
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    }
                })
                .then(response => response.json())
                .then(() => {
                    // if successful, open a transaction on your pending db
                    const transaction = db.transaction(["pending"], "readwrite");

                    // access your pending object store
                    const store = transaction.objectStore("pending");

                    // clear all items in your store
                    store.clear();
                });
        }
    };
}



// listen for app coming back online
window.addEventListener("online", checkDatabase);