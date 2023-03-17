# React For Squid Cloud

A library for integrating [Squid Cloud](https://squid.cloud) with React.

## Features

* Hooks for easy access to the Squid Client's collections, documents, and queries.
* A provider for access to the Squid Client anywhere in your React components.

## Getting started

### Requirements

This project requires a minimum React version of 16.11.

### Installation

Using npm:

```sh
npm install @squidcloud/react
```

### Configure Squid Cloud

Create an **Application** using the [Squid Cloud Console](https://console.squid.cloud).
* Copy the **Application ID**
* Add the following provider to your React application:
```jsx
import { SquidContextProvider } from "@squidcloud/react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"))

root.render(
  <SquidContextProvider
    options={{
      appId: '<SQUID_CLOUD_APP_ID>',
      region: '<SQUID_CLOUD_REGION>',
    }}
  >
    <App />
  </SquidContextProvider>
);
```

Note: If you're using a `.env` file for environment management, simply set the `appId` and `region` to your preferred envars.
```jsx
<SquidContextProvider
  options={{
    appId: process.env.SQUID_CLOUD_APP_ID,
    region: process.env.SQUID_CLOUD_REGION,
  }}
>
```
* If you're using an existing application, just reuse the existing application's ID.

### Hooks
Wrapping your application in a `SquidContextProvider` providers the app with access to a `Squid` instance.

To directly reference this instance, your can use the `useSquid` hook.
```jsx
function App() {
  const squid = useSquid()
  
  const foo = () => {
    squid.executeFunction("foo")
  }
  
  return <button onClick={foo}>Foo</button>
}
```

However, there are some additional hooks to provider easier access to collections (`useCollection`) queries (`useQuery`) and documents (`useDoc`, `useDocs`).

#### useCollection

The `useCollection` hook is a simple wrapper around `squid.collection(...)`. It allows you to access a collection without needing a `squid` reference. Once you have a collection, you can use the collection to create queries and manage documents.
```js
const collection = useCollection("my-collection")

const query = collection.query().where("foo", "==", "bar")
const doc = collection.doc("my-id");
```

#### useQuery

When a query has been created, you use the `useQuery` hook to execute it, and optionally `subscribe` to the results:
```jsx
function App() {
  const collection = useCollection("my-collection");

  /**
   * The list of docs will be streamed to the client and will be
   * kept up-to-date.
   */
  const docs = useQuery(
    collection.query().where("foo", ">", "bar"),
    true /* subscribe */
  )

  return (
    <ul>
      {docs.map((d) => (
        <li key={d.squidDocId}>
          {d.data.foo}
        </li>
      ))}
    </ul>
  );
}
```
If `subscribe` is set to true, data will be streamed to the client and the component will automatically re-render when new updates are received. If `subscribe` is false, the initial data is fetched for the query, but no changes are streamed.

#### useDoc
The `useDoc`hooks provides similar functionality, but instead of subscribing to a query, you subscribe to updates to a particular document. In this case the return value of the hook is not needed since you already have access to the document reference and its data:

```jsx
function App() {
  const collection = useCollection("my-collection");
  const doc = collection.doc("my-id")

  /**
   * Changes to th doc will be streamed to the client and it will be
   * kept up-to-date.
   */
  useDoc(doc, true /* subscribe */);
  
  return <span>{doc.data.foo}</span>
}
```

The same applies for `useDocs`, which can provide updates for multiple document references:
```jsx
function App() {
  const collection = useCollection("my-collection");
  const docs = [
    collection.doc("my-id-1"),
    collection.doc("my-id-2")
  ]

  /**
   * Changes to th documents will be streamed to the client and they will be
   * kept up-to-date.
   */
  useDocs(docs, true /* subscribe */)
  
  return (
    <ul>
      <li>{docs[0].data.foo}</li>
      <li>{docs[1].data.foo}</li>
    </ul>
  );
}
```

## API reference

Explore public APIs available in the [Squid Cloud documentation](https://squid.cloud/docs).

---
