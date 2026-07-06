/**
 * Base repository for Google Sheets data access.
 * Concrete repositories will extend this in Sprint 1.
 */
export abstract class BaseRepository {
  protected readonly repositoryName: string;

  constructor(repositoryName: string) {
    this.repositoryName = repositoryName;
  }

  protected getRepositoryName(): string {
    return this.repositoryName;
  }
}
