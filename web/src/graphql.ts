import { gql } from '@apollo/client';

export const GET_JOBS = gql`
  query GetJobs {
    jobs {
      id
      key
      name
      description
      cron
      timezone
      enabled
      params
      createdAt
      updatedAt
    }
  }
`;

export const GET_JOB_RUNS = gql`
  query GetJobRuns($id: Int!) {
    job(id: $id) {
      id
      name
      key
      runs {
        id
        status
        trigger
        startedAt
        finishedAt
        error
        createdAt
        stepRuns {
          id
          stepId
          type
          status
          input
          output
          error
          startedAt
          finishedAt
        }
      }
    }
  }
`;

export const GET_ALL_RUNS = gql`
  query GetAllRuns {
    allRuns {
      id
      status
      trigger
      startedAt
      finishedAt
      error
      createdAt
      job {
        id
        key
        name
      }
      stepRuns {
        id
        stepId
        type
        status
        input
        output
        error
        startedAt
        finishedAt
      }
    }
  }
`;

export const CREATE_JOB = gql`
  mutation CreateJob($input: CreateJobInput!) {
    createJob(input: $input) {
      id
      key
      name
      cron
      enabled
    }
  }
`;

export const UPDATE_JOB = gql`
  mutation UpdateJob($input: UpdateJobInput!) {
    updateJob(input: $input) {
      id
      key
      name
      cron
      enabled
    }
  }
`;

export const REMOVE_JOB = gql`
  mutation RemoveJob($id: Int!) {
    removeJob(id: $id)
  }
`;

export const RUN_JOB = gql`
  mutation RunJob($id: Int!) {
    runJob(id: $id)
  }
`;
