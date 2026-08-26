import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// In production (docker-compose) the app is served by nginx behind the same
// origin as the API, so a relative URL works. When the frontend is published
// separately (e.g. GitVerse Pages) set VITE_GRAPHQL_URL to the public API URL.
export const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL || '/graphql';

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
