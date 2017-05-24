//@flow
const { getDirectMessageThread } = require('../models/directMessageThread');
const { getMessages } = require('../models/message');
import paginate from '../utils/paginate-arrays';
import type { PaginationOptions } from '../utils/paginate-arrays';
import type { GraphQLContext } from '../';
import { encode, decode } from '../utils/base64';

type DirectMessageUser = {
  userId: any,
  lastSeen: Date,
  lastActivity: Date,
};

module.exports = {
  Query: {
    directMessageThread: (_: any, { id }: { id: String }) =>
      getDirectMessageThread(id),
  },
  DirectMessageThread: {
    messageConnection: (
      { id }: { id: String },
      { first = 100, after }: PaginationOptions
    ) => {
      const cursor = decode(after);
      return getMessages(id, {
        first,
        after: cursor,
      }).then(messages => {
        // Don't paginate messages for now...
        return {
          pageInfo: {
            hasNextPage: false,
          },
          edges: messages.map(message => ({
            node: {
              ...message,
            },
          })),
        };
      });
    },
    participants: (
      { participants }: { participants: Array<DirectMessageUser> },
      _: any,
      { loaders }: GraphQLContext
    ) => loaders.user.loadMany(participants),
    creator: (
      { creatorId }: { creatorId: string },
      _: any,
      { loaders }: GraphQLContext
    ) => loaders.user.load(creatorId),
    snippet: ({ id }, _: any, { loader }: GraphQLContext) =>
      getMessages(id).then(messages => {
        // if there are messages in the thread
        return messages.length > 0
          ? // return the last message's content as the snippet, or a placeholder
            messages[messages.length - 1].content.body
          : 'No messages yet...';
      }),
  },
};