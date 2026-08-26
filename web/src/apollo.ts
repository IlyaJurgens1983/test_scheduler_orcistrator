import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// In production the app is served behind the same origin as the API,
// so a relative URL works both locally (via Vite proxy) and in production.
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
