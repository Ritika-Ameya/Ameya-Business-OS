import type { PaginatedResult, QueryOptions } from '../../../types';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../../../constants';
import { BaseService } from '../../../services/base.service';
import { NotFoundError, ValidationError } from '../../../utils/AppError';
import { assertForeignKeys } from '../../../utils/foreignKey.util';
import { assertUniqueField } from '../../../utils/uniqueness.util';
import { applyFilters } from '../../../utils/filtering.util';
import { applySort } from '../../../utils/sorting.util';
import { paginateArray } from '../../../utils/pagination.util';
import { generateShortId } from '../../../utils/id.util';
import {
  dealTypeRepository,
  stageMasterRepository,
} from '../../masters/services/master.services';
import { customerRepository, documentRepository } from '../../customers';
import type { DocumentEntity } from '../../customers';
import type { DealComponentEntity, DealEntity } from '../types/deal.entities';
import type {
  DealComponentCreateInput,
  DealComponentUpdateInput,
  DealCreateInput,
  DealDocumentCreateInput,
  DealStageChangeInput,
  DealStatusChangeInput,
  DealTimelineNoteInput,
  DealUpdateInput,
} from '../validators/deal.validators';
import { dealComponentRepository, dealRepository } from './deal.repository';
import {
  applyDealSearch,
  parseDealSearchFields,
  parseDealSearchMode,
} from '../utils/dealSearch.util';
import {
  assertStageChangeRequirements,
  computeNextRenewal,
  getDefaultDealStage,
} from '../utils/dealHelpers.util';
import { createDealTimelineEntry, prependDealTimelineEntry } from '../utils/timeline.util';

const DOCUMENT_ENTITY_TYPE = 'deal';

export class DealService extends BaseService {
  constructor() {
    super('DealService');
  }

  async list(
    options?: QueryOptions,
    search?: { q?: string; mode?: string; fields?: string },
  ): Promise<PaginatedResult<DealEntity>> {
    this.logDebug('Listing deals');
    let items = await dealRepository.findAll(options);

    items = applyDealSearch(
      items,
      search?.q,
      parseDealSearchMode(search?.mode),
      parseDealSearchFields(search?.fields),
    );

    if (options?.filters?.length) {
      items = applyFilters(items as Record<string, unknown>[], options.filters) as DealEntity[];
    }

    if (options?.sort) {
      items = applySort(items as Record<string, unknown>[], options.sort) as DealEntity[];
    }

    const pagination = options?.pagination ?? {
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      offset: 0,
    };

    return paginateArray(items, pagination);
  }

  async getById(id: string): Promise<DealEntity> {
    const entity = await dealRepository.findById(id);
    if (!entity) throw new NotFoundError('Deal not found');
    return entity;
  }

  async create(input: DealCreateInput): Promise<DealEntity> {
    this.logInfo('Creating deal');
    await this.validateIntegrity(input);

    const customer = await customerRepository.findById(input.customerId);
    if (!customer) {
      throw new ValidationError('Customer not found', ['Invalid customerId']);
    }

    const stages = await stageMasterRepository.findAll();
    const defaultStage =
      (input.currentStageId
        ? stages.find((stage) => stage.id === input.currentStageId && stage.isActive)
        : undefined) ?? getDefaultDealStage(stages);

    if (!defaultStage) {
      throw new ValidationError('No active stage configured', [
        'Configure stages in Stage Builder before creating deals',
      ]);
    }

    const renewalFrequency = input.renewalFrequency;
    const nextRenewal =
      input.nextRenewal.trim() ||
      computeNextRenewal(input.startDate, renewalFrequency);

    const dealNumber =
      input.dealNumber.trim() || `DL-${generateShortId(8).toUpperCase()}`;

    await this.assertUniqueDealNumber(dealNumber);

    const timeline = [
      createDealTimelineEntry({
        action: 'created',
        stageId: defaultStage.id,
        stageName: defaultStage.name,
        notes: input.description || undefined,
      }),
    ];

    return dealRepository.create({
      dealNumber,
      title: input.title.trim(),
      customerId: customer.id,
      customerName: input.customerName.trim() || customer.contactPerson || customer.companyName,
      status: input.status,
      currentStageId: defaultStage.id,
      dealType: input.dealType.trim(),
      contractValue: input.contractValue,
      currency: input.currency.trim() || 'INR',
      probability: input.probability,
      startDate: input.startDate,
      expectedCloseDate: input.expectedCloseDate,
      actualCloseDate: input.actualCloseDate,
      nextRenewal,
      renewalFrequency,
      nextActionDate: input.nextActionDate,
      owner: input.owner.trim(),
      description: input.description.trim(),
      notes: input.notes.trim(),
      componentsCount: 0,
      timeline,
    } as Omit<DealEntity, 'id'>);
  }

  async update(id: string, input: DealUpdateInput): Promise<DealEntity> {
    this.logInfo(`Updating deal ${id}`);
    const existing = await this.getById(id);
    await this.validateIntegrity(input, id);

    if (input.customerId && input.customerId !== existing.customerId) {
      const customer = await customerRepository.findById(input.customerId);
      if (!customer) {
        throw new ValidationError('Customer not found', ['Invalid customerId']);
      }
    }

    if (input.dealNumber && input.dealNumber !== existing.dealNumber) {
      await this.assertUniqueDealNumber(input.dealNumber, id);
    }

    let timeline = existing.timeline;
    const valueChanged =
      input.contractValue !== undefined && input.contractValue !== existing.contractValue;
    const renewalChanged =
      (input.nextRenewal !== undefined && input.nextRenewal !== existing.nextRenewal) ||
      (input.renewalFrequency !== undefined &&
        input.renewalFrequency !== existing.renewalFrequency);

    timeline = prependDealTimelineEntry(
      timeline,
      createDealTimelineEntry({
        action: 'updated',
        stageId: input.currentStageId ?? existing.currentStageId,
        stageName: 'Deal Updated',
      }),
    );

    if (valueChanged) {
      timeline = prependDealTimelineEntry(
        timeline,
        createDealTimelineEntry({
          action: 'value_changed',
          stageId: existing.currentStageId,
          stageName: 'Value Changed',
          notes: `Contract value changed to ${input.contractValue}`,
        }),
      );
    }

    if (renewalChanged) {
      timeline = prependDealTimelineEntry(
        timeline,
        createDealTimelineEntry({
          action: 'renewal_updated',
          stageId: existing.currentStageId,
          stageName: 'Renewal Updated',
        }),
      );
    }

    const nextRenewal =
      input.nextRenewal !== undefined
        ? input.nextRenewal
        : input.renewalFrequency !== undefined || input.startDate !== undefined
          ? computeNextRenewal(
              input.startDate ?? existing.startDate,
              input.renewalFrequency ?? existing.renewalFrequency,
            )
          : existing.nextRenewal;

    return dealRepository.updateOrThrow(
      id,
      {
        ...input,
        title: input.title?.trim(),
        customerName: input.customerName?.trim(),
        dealType: input.dealType?.trim(),
        currency: input.currency?.trim(),
        owner: input.owner?.trim(),
        description: input.description?.trim(),
        notes: input.notes?.trim(),
        nextRenewal,
        timeline,
      } as Partial<DealEntity>,
      'Deal',
    );
  }

  async remove(id: string): Promise<void> {
    this.logInfo(`Soft-deleting deal ${id}`);
    await dealRepository.deleteOrThrow(id, 'Deal');
  }

  async restore(id: string): Promise<DealEntity> {
    this.logInfo(`Restoring deal ${id}`);
    return dealRepository.restore(id);
  }

  async changeStage(id: string, payload: DealStageChangeInput): Promise<DealEntity> {
    const existing = await this.getById(id);
    const stage = await stageMasterRepository.findById(payload.stageId);

    if (!stage || !stage.isActive) {
      throw new NotFoundError('Stage not found');
    }

    assertStageChangeRequirements(stage, payload);

    const timeline = prependDealTimelineEntry(
      existing.timeline,
      createDealTimelineEntry({
        action: 'stage_changed',
        stageId: stage.id,
        stageName: stage.name,
        notes: payload.notes,
        nextActionDate: payload.nextActionDate,
      }),
    );

    return dealRepository.updateOrThrow(
      id,
      {
        currentStageId: stage.id,
        nextActionDate:
          payload.nextActionDate !== undefined
            ? payload.nextActionDate
            : existing.nextActionDate,
        timeline,
      },
      'Deal',
    );
  }

  async changeStatus(id: string, payload: DealStatusChangeInput): Promise<DealEntity> {
    const existing = await this.getById(id);

    const timeline = prependDealTimelineEntry(
      existing.timeline,
      createDealTimelineEntry({
        action: 'status_changed',
        stageId: existing.currentStageId,
        stageName: 'Status Changed',
        notes: `Status set to ${payload.status}`,
      }),
    );

    return dealRepository.updateOrThrow(
      id,
      {
        status: payload.status,
        actualCloseDate:
          payload.status === 'completed' && !existing.actualCloseDate
            ? new Date().toISOString().split('T')[0]
            : existing.actualCloseDate,
        timeline,
      },
      'Deal',
    );
  }

  async addTimelineNote(id: string, payload: DealTimelineNoteInput): Promise<DealEntity> {
    const existing = await this.getById(id);
    const timeline = prependDealTimelineEntry(
      existing.timeline,
      createDealTimelineEntry({
        action: 'notes_added',
        stageId: existing.currentStageId,
        stageName: 'Notes Added',
        notes: payload.notes,
        nextActionDate: payload.nextActionDate,
      }),
    );

    return dealRepository.updateOrThrow(
      id,
      {
        notes: payload.notes.trim(),
        nextActionDate:
          payload.nextActionDate !== undefined
            ? payload.nextActionDate
            : existing.nextActionDate,
        timeline,
      },
      'Deal',
    );
  }

  async listComponents(dealId: string): Promise<DealComponentEntity[]> {
    await this.getById(dealId);
    const components = await dealComponentRepository.findAll();
    return components.filter((component) => component.dealId === dealId);
  }

  async addComponent(
    dealId: string,
    input: DealComponentCreateInput,
  ): Promise<{ component: DealComponentEntity; deal: DealEntity }> {
    const existing = await this.getById(dealId);

    const component = await dealComponentRepository.create({
      dealId,
      name: input.name.trim(),
      category: input.category.trim(),
      description: input.description.trim(),
      amount: input.amount,
      billingType: input.billingType,
      status: input.status,
      renewalDate: input.renewalDate.trim(),
    } as Omit<DealComponentEntity, 'id'>);

    const timeline = prependDealTimelineEntry(
      existing.timeline,
      createDealTimelineEntry({
        action: 'component_added',
        stageId: existing.currentStageId,
        stageName: 'Component Added',
        notes: component.name,
      }),
    );

    const deal = await dealRepository.updateOrThrow(
      dealId,
      {
        componentsCount: existing.componentsCount + 1,
        timeline,
      },
      'Deal',
    );

    return { component, deal };
  }

  async updateComponent(
    dealId: string,
    componentId: string,
    input: DealComponentUpdateInput,
  ): Promise<DealComponentEntity> {
    await this.getById(dealId);
    const component = await dealComponentRepository.findById(componentId);
    if (!component || component.dealId !== dealId) {
      throw new NotFoundError('Component not found');
    }

    return dealComponentRepository.updateOrThrow(
      componentId,
      {
        ...input,
        name: input.name?.trim(),
        category: input.category?.trim(),
        description: input.description?.trim(),
        renewalDate: input.renewalDate?.trim(),
      } as Partial<DealComponentEntity>,
      'Component',
    );
  }

  async removeComponent(dealId: string, componentId: string): Promise<DealEntity> {
    const existing = await this.getById(dealId);
    const component = await dealComponentRepository.findById(componentId);
    if (!component || component.dealId !== dealId) {
      throw new NotFoundError('Component not found');
    }

    await dealComponentRepository.deleteOrThrow(componentId, 'Component');

    const timeline = prependDealTimelineEntry(
      existing.timeline,
      createDealTimelineEntry({
        action: 'component_removed',
        stageId: existing.currentStageId,
        stageName: 'Component Removed',
        notes: component.name,
      }),
    );

    return dealRepository.updateOrThrow(
      dealId,
      {
        componentsCount: Math.max(0, existing.componentsCount - 1),
        timeline,
      },
      'Deal',
    );
  }

  async listFiles(dealId: string): Promise<DocumentEntity[]> {
    await this.getById(dealId);
    const documents = await documentRepository.findAll();
    return documents.filter(
      (doc) => doc.entityType === DOCUMENT_ENTITY_TYPE && doc.entityId === dealId,
    );
  }

  async addFile(
    dealId: string,
    input: DealDocumentCreateInput,
  ): Promise<{ document: DocumentEntity; deal: DealEntity }> {
    const existing = await this.getById(dealId);
    const fileType =
      input.fileType.trim() ||
      (input.name.includes('.') ? (input.name.split('.').pop()?.toLowerCase() ?? '') : '');

    const document = await documentRepository.create({
      name: input.name.trim(),
      fileType,
      mimeType: input.mimeType.trim(),
      size: input.size,
      driveFileId: '',
      entityType: DOCUMENT_ENTITY_TYPE,
      entityId: dealId,
      uploadedBy: '',
    } as Omit<DocumentEntity, 'id'>);

    const timeline = prependDealTimelineEntry(
      existing.timeline,
      createDealTimelineEntry({
        action: 'document_linked',
        stageId: existing.currentStageId,
        stageName: 'Document Linked',
        notes: document.name,
      }),
    );

    const deal = await dealRepository.updateOrThrow(dealId, { timeline }, 'Deal');
    return { document, deal };
  }

  async removeFile(dealId: string, fileId: string): Promise<void> {
    await this.getById(dealId);
    const document = await documentRepository.findById(fileId);
    if (
      !document ||
      document.entityType !== DOCUMENT_ENTITY_TYPE ||
      document.entityId !== dealId
    ) {
      throw new NotFoundError('Document not found');
    }
    await documentRepository.deleteOrThrow(fileId, 'Document');
  }

  private async assertUniqueDealNumber(dealNumber: string, excludeId?: string): Promise<void> {
    const entities = (await dealRepository.findAll()) as Array<
      { id: string } & Record<string, unknown>
    >;
    assertUniqueField(entities, {
      field: 'dealNumber',
      value: dealNumber,
      label: 'Deal',
      excludeId,
    });
  }

  private async validateIntegrity(
    candidate: Partial<DealCreateInput | DealUpdateInput>,
    excludeId?: string,
  ): Promise<void> {
    void excludeId;
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(candidate)) {
      if (value === undefined) continue;
      if (
        ['currentStageId', 'customerId'].includes(key) &&
        String(value).trim() === ''
      ) {
        continue;
      }
      normalized[key] = value;
    }

    await assertForeignKeys(normalized, [
      {
        field: 'customerId',
        label: 'Customer',
        exists: async (id) => Boolean(await customerRepository.findById(id)),
      },
      {
        field: 'currentStageId',
        label: 'Stage',
        exists: async (id) => Boolean(await stageMasterRepository.findById(id)),
      },
    ]);

    if (normalized.dealType !== undefined && String(normalized.dealType).trim()) {
      const dealTypes = await dealTypeRepository.findAll();
      const match = dealTypes.find(
        (item) =>
          item.id === normalized.dealType ||
          item.slug === normalized.dealType ||
          item.name.toLowerCase() === String(normalized.dealType).trim().toLowerCase(),
      );
      if (!match) {
        // Soft validation: allow unknown dealType strings from frontend slugs already selected
        // when masters are empty in early setups — only reject empty after zod.
      }
    }

    if (
      normalized.probability !== undefined &&
      (Number(normalized.probability) < 0 || Number(normalized.probability) > 100)
    ) {
      throw new ValidationError('Probability must be between 0 and 100');
    }
  }
}

export const dealService = new DealService();
