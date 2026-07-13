import type { PaginatedResult, QueryOptions } from '../../../types';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../../../constants';
import { BaseService } from '../../../services/base.service';
import { NotFoundError, ValidationError } from '../../../utils/AppError';
import { assertForeignKeys } from '../../../utils/foreignKey.util';
import { assertUniqueField } from '../../../utils/uniqueness.util';
import { applyFilters } from '../../../utils/filtering.util';
import { applySort } from '../../../utils/sorting.util';
import { paginateArray } from '../../../utils/pagination.util';
import {
  countryRepository,
  industryRepository,
  opportunitySourceRepository,
  stageMasterRepository,
  stateRepository,
} from '../../masters/services/master.services';
import type { CustomerEntity, DocumentEntity } from '../types/customer.entities';
import type {
  CustomerCreateInput,
  CustomerDocumentCreateInput,
  CustomerRecordTypeChangeInput,
  CustomerStageChangeInput,
  CustomerTimelineNoteInput,
  CustomerUpdateInput,
} from '../validators/customer.validators';
import { customerRepository, documentRepository } from './customer.repository';
import {
  applyCustomerSearch,
  parseSearchFields,
  parseSearchMode,
} from '../utils/customerSearch.util';
import {
  assertStageChangeRequirements,
  computeReminderDate,
  getDefaultStageForRecordType,
  resolveRecordTypeFromStage,
  resolveStatusAfterRecordTypeChange,
} from '../utils/stageEngine.util';
import { createTimelineEntry, prependTimelineEntry } from '../utils/timeline.util';

const DOCUMENT_ENTITY_TYPE = 'customer';

const toDateOnly = (date = new Date()): string => date.toISOString().split('T')[0];

const OPTIONAL_FK_FIELDS = new Set([
  'industryId',
  'sourceId',
  'countryId',
  'stateId',
  'currentStageId',
]);

export class CustomerService extends BaseService {
  constructor() {
    super('CustomerService');
  }

  async list(
    options?: QueryOptions,
    search?: { q?: string; mode?: string; fields?: string },
  ): Promise<PaginatedResult<CustomerEntity>> {
    this.logDebug('Listing customers');
    let items = await customerRepository.findAll(options);

    items = applyCustomerSearch(
      items,
      search?.q,
      parseSearchMode(search?.mode),
      parseSearchFields(search?.fields),
    );

    if (options?.filters?.length) {
      items = applyFilters(items as Record<string, unknown>[], options.filters) as CustomerEntity[];
    }

    if (options?.sort) {
      items = applySort(items as Record<string, unknown>[], options.sort) as CustomerEntity[];
    }

    const pagination = options?.pagination ?? {
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      offset: 0,
    };

    return paginateArray(items, pagination);
  }

  async getById(id: string): Promise<CustomerEntity> {
    const entity = await customerRepository.findById(id);
    if (!entity) {
      throw new NotFoundError('Customer not found');
    }
    return entity;
  }

  async create(input: CustomerCreateInput): Promise<CustomerEntity> {
    this.logInfo('Creating customer/opportunity');
    await this.validateIntegrity(input);

    const stages = await stageMasterRepository.findAll();
    const recordType = input.recordType;
    const defaultStage =
      (input.currentStageId
        ? stages.find((stage) => stage.id === input.currentStageId)
        : undefined) ?? getDefaultStageForRecordType(stages, recordType);

    if (!defaultStage) {
      throw new ValidationError('No applicable stage configured for this record type', [
        'Configure stages in Stage Builder before creating opportunities or customers',
      ]);
    }

    if (!defaultStage.isActive) {
      throw new ValidationError('Selected stage is inactive');
    }

    const resolvedRecordType = resolveRecordTypeFromStage(recordType, defaultStage);
    const status =
      input.status ?? (resolvedRecordType === 'customer' ? 'active' : 'prospect');

    const timeline = [
      createTimelineEntry({
        action: 'created',
        stageId: defaultStage.id,
        stageName: defaultStage.name,
        notes: input.notes || undefined,
      }),
    ];

    return customerRepository.create({
      recordType: resolvedRecordType,
      status,
      currentStageId: defaultStage.id,
      companyName: input.companyName.trim(),
      gstin: input.gstin.trim().toUpperCase(),
      industryId: input.industryId,
      sourceId: input.sourceId,
      contactPerson: input.contactPerson.trim(),
      phone: input.phone.trim(),
      alternatePhone: input.alternatePhone.trim(),
      email: input.email.trim(),
      website: input.website.trim(),
      billingAddress: input.billingAddress.trim(),
      serviceAddress: input.serviceAddress.trim(),
      countryId: input.countryId,
      stateId: input.stateId,
      city: input.city.trim(),
      pincode: input.pincode.trim(),
      notes: input.notes.trim(),
      businessValue: input.businessValue,
      expectedRevenue: input.expectedRevenue,
      nextActionDate: input.nextActionDate,
      lastContactDate: input.lastContactDate,
      renewalDate: input.renewalDate,
      outstandingAmount: input.outstandingAmount,
      tags: input.tags,
      isActive: input.isActive,
      timeline,
      activeDeals: input.activeDeals,
      lastPayment: input.lastPayment,
      businessSince: input.businessSince || toDateOnly(),
    } as Omit<CustomerEntity, 'id'>);
  }

  async update(id: string, input: CustomerUpdateInput): Promise<CustomerEntity> {
    this.logInfo(`Updating customer ${id}`);
    const existing = await this.getById(id);
    await this.validateIntegrity(input, id);

    if (input.currentStageId) {
      const stage = await stageMasterRepository.findById(input.currentStageId);
      if (!stage || !stage.isActive) {
        throw new ValidationError('Stage not found or inactive', ['Invalid currentStageId']);
      }
    }

    const timeline = prependTimelineEntry(
      existing.timeline,
      createTimelineEntry({
        action: 'edited',
        stageId: input.currentStageId ?? existing.currentStageId,
        stageName: 'Edited',
        notes: input.notes !== undefined ? input.notes : undefined,
      }),
    );

    return customerRepository.updateOrThrow(
      id,
      {
        ...input,
        companyName: input.companyName?.trim(),
        gstin: input.gstin?.trim().toUpperCase(),
        contactPerson: input.contactPerson?.trim(),
        phone: input.phone?.trim(),
        alternatePhone: input.alternatePhone?.trim(),
        email: input.email?.trim(),
        website: input.website?.trim(),
        billingAddress: input.billingAddress?.trim(),
        serviceAddress: input.serviceAddress?.trim(),
        city: input.city?.trim(),
        pincode: input.pincode?.trim(),
        notes: input.notes?.trim(),
        timeline,
      } as Partial<CustomerEntity>,
      'Customer',
    );
  }

  async remove(id: string): Promise<void> {
    this.logInfo(`Soft-deleting customer ${id}`);
    await customerRepository.deleteOrThrow(id, 'Customer');
  }

  async restore(id: string): Promise<CustomerEntity> {
    this.logInfo(`Restoring customer ${id}`);
    return customerRepository.restore(id);
  }

  async changeStage(id: string, payload: CustomerStageChangeInput): Promise<CustomerEntity> {
    const existing = await this.getById(id);
    const stage = await stageMasterRepository.findById(payload.stageId);

    if (!stage || !stage.isActive) {
      throw new NotFoundError('Stage not found');
    }

    const appliesToCurrent =
      stage.applicableFor === 'both' || stage.applicableFor === existing.recordType;
    const isConversionStage =
      stage.canConvertToCustomer || stage.applicableFor === 'customer';

    if (!appliesToCurrent && !isConversionStage) {
      throw new ValidationError('Stage is not applicable for this record type');
    }

    assertStageChangeRequirements(stage, payload);

    const previousRecordType = existing.recordType;
    const recordType = resolveRecordTypeFromStage(existing.recordType, stage);
    const converted = previousRecordType === 'opportunity' && recordType === 'customer';
    const status = resolveStatusAfterRecordTypeChange(existing.status, recordType);

    let timeline = prependTimelineEntry(
      existing.timeline,
      createTimelineEntry({
        action: 'stage_changed',
        stageId: stage.id,
        stageName: stage.name,
        notes: payload.notes,
        nextActionDate: payload.nextActionDate,
      }),
    );

    if (converted) {
      timeline = prependTimelineEntry(
        timeline,
        createTimelineEntry({
          action: 'converted_to_customer',
          stageId: stage.id,
          stageName: stage.name,
          notes: payload.notes,
        }),
      );
    }

    const nextActionDate =
      payload.nextActionDate !== undefined ? payload.nextActionDate : existing.nextActionDate;

    if (payload.nextActionDate) {
      void computeReminderDate(payload.nextActionDate, stage.reminderOffset);
    }

    return customerRepository.updateOrThrow(
      id,
      {
        currentStageId: stage.id,
        recordType,
        status,
        nextActionDate,
        timeline,
        isActive: recordType === 'customer' ? true : existing.isActive,
      },
      'Customer',
    );
  }

  async changeRecordType(
    id: string,
    payload: CustomerRecordTypeChangeInput,
  ): Promise<CustomerEntity> {
    const existing = await this.getById(id);
    const stages = await stageMasterRepository.findAll();
    const currentStage = stages.find((stage) => stage.id === existing.currentStageId);

    const stageStillApplies =
      currentStage &&
      currentStage.isActive &&
      (currentStage.applicableFor === 'both' ||
        currentStage.applicableFor === payload.recordType);

    const nextStageId = stageStillApplies
      ? existing.currentStageId
      : getDefaultStageForRecordType(stages, payload.recordType)?.id;

    if (!nextStageId) {
      throw new ValidationError('No applicable stage configured for this record type');
    }

    const status = resolveStatusAfterRecordTypeChange(existing.status, payload.recordType);
    const converted =
      payload.recordType === 'customer' && existing.recordType === 'opportunity';

    const timeline = prependTimelineEntry(
      existing.timeline,
      createTimelineEntry({
        action: converted ? 'converted_to_customer' : 'edited',
        stageId: nextStageId,
        stageName: converted ? 'Converted to Customer' : 'Record Type Updated',
      }),
    );

    return customerRepository.updateOrThrow(
      id,
      {
        recordType: payload.recordType,
        currentStageId: nextStageId,
        status,
        timeline,
      },
      'Customer',
    );
  }

  async addTimelineNote(
    id: string,
    payload: CustomerTimelineNoteInput,
  ): Promise<CustomerEntity> {
    const existing = await this.getById(id);
    const timeline = prependTimelineEntry(
      existing.timeline,
      createTimelineEntry({
        action: 'notes_added',
        stageId: existing.currentStageId,
        stageName: 'Notes Added',
        notes: payload.notes,
        nextActionDate: payload.nextActionDate,
      }),
    );

    return customerRepository.updateOrThrow(
      id,
      {
        notes: payload.notes.trim(),
        nextActionDate:
          payload.nextActionDate !== undefined
            ? payload.nextActionDate
            : existing.nextActionDate,
        timeline,
      },
      'Customer',
    );
  }

  async listFiles(customerId: string): Promise<DocumentEntity[]> {
    await this.getById(customerId);
    const documents = await documentRepository.findAll();
    return documents.filter(
      (doc) => doc.entityType === DOCUMENT_ENTITY_TYPE && doc.entityId === customerId,
    );
  }

  async addFile(
    customerId: string,
    input: CustomerDocumentCreateInput,
  ): Promise<{ document: DocumentEntity; customer: CustomerEntity }> {
    const existing = await this.getById(customerId);

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
      entityId: customerId,
      uploadedBy: '',
    } as Omit<DocumentEntity, 'id'>);

    const timeline = prependTimelineEntry(
      existing.timeline,
      createTimelineEntry({
        action: 'file_uploaded',
        stageId: existing.currentStageId,
        stageName: 'File Uploaded',
        notes: document.name,
      }),
    );

    const customer = await customerRepository.updateOrThrow(
      customerId,
      { timeline },
      'Customer',
    );

    return { document, customer };
  }

  async removeFile(customerId: string, fileId: string): Promise<void> {
    await this.getById(customerId);
    const document = await documentRepository.findById(fileId);
    if (
      !document ||
      document.entityType !== DOCUMENT_ENTITY_TYPE ||
      document.entityId !== customerId
    ) {
      throw new NotFoundError('Document not found');
    }
    await documentRepository.deleteOrThrow(fileId, 'Document');
  }

  private async validateIntegrity(
    candidate: Partial<CustomerCreateInput | CustomerUpdateInput>,
    excludeId?: string,
  ): Promise<void> {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(candidate)) {
      if (value === undefined) continue;
      if (OPTIONAL_FK_FIELDS.has(key) && String(value).trim() === '') continue;
      normalized[key] = value;
    }

    await assertForeignKeys(normalized, [
      {
        field: 'industryId',
        label: 'Industry',
        exists: async (id) => Boolean(await industryRepository.findById(id)),
      },
      {
        field: 'sourceId',
        label: 'Opportunity Source',
        exists: async (id) => Boolean(await opportunitySourceRepository.findById(id)),
      },
      {
        field: 'countryId',
        label: 'Country',
        exists: async (id) => Boolean(await countryRepository.findById(id)),
      },
      {
        field: 'stateId',
        label: 'State',
        exists: async (id) => {
          const state = await stateRepository.findById(id);
          if (!state) return false;
          const countryId = String(normalized.countryId ?? '').trim();
          if (countryId && state.countryId !== countryId) return false;
          return true;
        },
      },
      {
        field: 'currentStageId',
        label: 'Stage',
        exists: async (id) => Boolean(await stageMasterRepository.findById(id)),
      },
    ]);

    const entities = (await customerRepository.findAll()) as Array<
      { id: string } & Record<string, unknown>
    >;

    if ('companyName' in normalized) {
      assertUniqueField(entities, {
        field: 'companyName',
        value: normalized.companyName,
        label: 'Customer',
        excludeId,
      });
    }

    if ('gstin' in normalized) {
      assertUniqueField(entities, {
        field: 'gstin',
        value: normalized.gstin,
        label: 'Customer',
        excludeId,
      });
    }
  }
}

export const customerService = new CustomerService();
