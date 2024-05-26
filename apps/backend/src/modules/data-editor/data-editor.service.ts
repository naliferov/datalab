import { Controller, Get, Injectable, Post, Query } from '@nestjs/common';

@Injectable()
export class DataEditorService {
  getById(): string {
    // let { id, subIds, path, depth, getMeta, useRepo, repoName } = x.get;

    // if (id) {
    //   if (useRepo) return await b.p('repo', { get: { id }, repoName });

    //   return await fillVar({ b, id, subIds: new Set(subIds), depth, getMeta });
    // }

    return '';
  }

  getByPath(): string {
    return '';
  }
  setValue(): string {
    return '';
  }

  changeOrder(): string {
    return '';
  }

  deleteKeyOfMap(): string {
    return '';
  }
}
