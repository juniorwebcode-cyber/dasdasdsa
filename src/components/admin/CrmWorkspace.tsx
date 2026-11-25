import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  FileText,
  MessageCircle,
  Plus,
  Trash2,
  UserPlus
} from 'lucide-react';
import {
  PIPELINE_STAGES,
  SCORE_LABELS,
  type Client,
  type Lead,
  type LeadScore,
  type PipelineItem,
  type PipelineStage,
  type Property,
  type Proposal,
  type Task,
  type Visit
} from '../../types/realEstate';
import {
  convertLeadToCrm,
  movePipelineStage,
  removeClient,
  removeLead,
  removePipelineItem,
  removeProposal,
  removeTask,
  removeVisit,
  saveClient,
  savePipelineItem,
  saveProposal,
  saveTask,
  saveVisit,
  updateLeadAdmin
} from '../../services/adminStoreService';
import { uploadMediaWithCompression } from '../../services/blobUploadService';
import { buildWhatsAppUrl } from '../../utils/utm';

interface CrmWorkspaceProps {
  section: 'pipeline' | 'leads' | 'clients' | 'visits' | 'proposals' | 'tasks';
  leads: Lead[];
  clients: Client[];
  pipeline: PipelineItem[];
  visits: Visit[];
  proposals: Proposal[];
  tasks: Task[];
  properties: Property[];
  whatsappNumber: string;
  onRefresh: () => Promise<void>;
}

export function CrmWorkspace({
  section,
  leads,
  clients,
  pipeline,
  visits,
  proposals,
  tasks,
  properties,
  whatsappNumber,
  onRefresh
}: CrmWorkspaceProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'todos' | LeadScore>('todos');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [interactionNote, setInteractionNote] = useState('');

  // Quick creation states
  const [newDealName, setNewDealName] = useState('');
  const [newDealProperty, setNewDealProperty] = useState('');
  const [newDealScore, setNewDealScore] = useState<LeadScore>('morno');

  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientBudget, setNewClientBudget] = useState('');

  const [visitClientName, setVisitClientName] = useState('');
  const [visitClientPhone, setVisitClientPhone] = useState('');
  const [visitPropertyTitle, setVisitPropertyTitle] = useState('');
  const [visitDate, setVisitDate] = useState('');

  const [proposalClientName, setProposalClientName] = useState('');
  const [proposalPropertyTitle, setProposalPropertyTitle] = useState('');
  const [proposalValue, setProposalValue] = useState('');
  const [proposalConditions, setProposalConditions] = useState('');
  const [proposalFileUploading, setProposalFileUploading] = useState(false);
  const [proposalDocUrl, setProposalDocUrl] = useState('');
  const [proposalDocName, setProposalDocName] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskPriority, setTaskPriority] = useState<'alta' | 'media' | 'baixa'>('media');

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (scoreFilter !== 'todos' && l.score !== scoreFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return `${l.name} ${l.phone} ${l.source} ${l.utmCampaign || ''}`
          .toLowerCase()
          .includes(q);
      }
      return true;
    });
  }, [leads, scoreFilter, searchTerm]);

  const handleConvertLead = async (lead: Lead) => {
    setBusyId(lead.id);
    try {
      await convertLeadToCrm(lead);
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleCreatePipelineDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealName.trim()) return;
    setBusyId('new-deal');
    try {
      await savePipelineItem({
        clientName: newDealName.trim(),
        propertyTitle: newDealProperty.trim() || undefined,
        stage: 'novo',
        score: newDealScore
      });
      setNewDealName('');
      setNewDealProperty('');
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim()) return;
    setBusyId('new-client');
    try {
      await saveClient({
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
        email: newClientEmail.trim() || undefined,
        budgetText: newClientBudget.trim() || undefined,
        score: 'morno',
        stage: 'contato',
        origin: 'cadastro_manual',
        preferredRegions: ['Sorocaba e região'],
        tags: [],
        interactions: [`[${new Date().toLocaleDateString('pt-BR')}] Ficha criada manualmente no CRM`]
      });
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
      setNewClientBudget('');
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleAddInteraction = async () => {
    if (!selectedClient || !interactionNote.trim()) return;
    const entry = `[${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })}] ${interactionNote.trim()}`;
    const updated: Client = {
      ...selectedClient,
      interactions: [entry, ...(selectedClient.interactions || [])].slice(0, 50)
    };
    await saveClient(updated);
    setSelectedClient(updated);
    setInteractionNote('');
    await onRefresh();
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitClientName.trim() || !visitPropertyTitle.trim() || !visitDate.trim()) return;
    setBusyId('new-visit');
    try {
      await saveVisit({
        clientName: visitClientName.trim(),
        clientPhone: visitClientPhone.trim() || undefined,
        propertyTitle: visitPropertyTitle.trim(),
        scheduledAt: visitDate.trim(),
        status: 'agendada',
        reminderEnabled: true
      });
      setVisitClientName('');
      setVisitClientPhone('');
      setVisitPropertyTitle('');
      setVisitDate('');
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleProposalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProposalFileUploading(true);
    try {
      const uploaded = await uploadMediaWithCompression(file, {
        category: 'documento'
      });
      setProposalDocUrl(uploaded.url);
      setProposalDocName(file.name);
    } catch {
      setProposalDocName(`${file.name} (falha ao enviar)`);
      setProposalDocUrl('');
    } finally {
      setProposalFileUploading(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalClientName.trim() || !proposalPropertyTitle.trim() || !proposalValue.trim()) return;
    setBusyId('new-proposal');
    try {
      await saveProposal({
        clientName: proposalClientName.trim(),
        propertyTitle: proposalPropertyTitle.trim(),
        valueText: proposalValue.trim(),
        paymentConditions: proposalConditions.trim() || undefined,
        status: 'rascunho',
        documentUrl: proposalDocUrl || undefined,
        documentName: proposalDocName || undefined
      });
      setProposalClientName('');
      setProposalPropertyTitle('');
      setProposalValue('');
      setProposalConditions('');
      setProposalDocUrl('');
      setProposalDocName('');
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setBusyId('new-task');
    try {
      await saveTask({
        title: taskTitle.trim(),
        dueDate: taskDue.trim() || undefined,
        priority: taskPriority,
        completed: false
      });
      setTaskTitle('');
      setTaskDue('');
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  // =========================================================================
  // 1. PIPELINE KANBAN
  // =========================================================================
  if (section === 'pipeline') {
    return (
      <div className="space-y-6">
        <form
          onSubmit={handleCreatePipelineDeal}
          className="bg-white border border-[#E6E2DA] rounded-2xl p-4 flex flex-wrap items-end gap-3"
        >
          <label className="flex-1 min-w-[180px] space-y-1">
            <span className="text-xs font-medium text-[#71717A]">Cliente</span>
            <input
              type="text"
              required
              value={newDealName}
              onChange={(e) => setNewDealName(e.target.value)}
              placeholder="Nome do cliente"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>
          <label className="flex-1 min-w-[180px] space-y-1">
            <span className="text-xs font-medium text-[#71717A]">Imóvel / Interesse</span>
            <input
              type="text"
              value={newDealProperty}
              onChange={(e) => setNewDealProperty(e.target.value)}
              placeholder="Ex: Apartamento na planta"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>
          <label className="w-36 space-y-1">
            <span className="text-xs font-medium text-[#71717A]">Temperatura</span>
            <select
              value={newDealScore}
              onChange={(e) => setNewDealScore(e.target.value as LeadScore)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            >
              <option value="quente">Quente</option>
              <option value="morno">Morno</option>
              <option value="frio">Frio</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={busyId === 'new-deal'}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar ao funil</span>
          </button>
        </form>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const items = pipeline.filter((item) => item.stage === stage.id);
            return (
              <div
                key={stage.id}
                className="w-[270px] shrink-0 bg-[#F3F1EC] border border-[#E6E2DA] rounded-2xl p-3 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold text-[#18181B]">{stage.label}</h3>
                  <span className="text-xs font-mono-tabular text-[#71717A]">{items.length}</span>
                </div>

                <div className="space-y-2.5">
                  {items.length === 0 ? (
                    <div className="border border-dashed border-[#D4CFC5] rounded-xl p-4 text-center text-[11px] text-[#71717A]">
                      Sem negócios nesta etapa
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-[#E6E2DA] rounded-xl p-3.5 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-[#18181B] leading-snug">
                            {item.clientName}
                          </p>
                          <button
                            type="button"
                            onClick={async () => {
                              await removePipelineItem(item.id);
                              await onRefresh();
                            }}
                            title="Remover do pipeline"
                            className="text-[#A1A1AA] hover:text-[#DC2626] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.propertyTitle ? (
                          <p className="text-xs text-[#52525B] line-clamp-2">{item.propertyTitle}</p>
                        ) : null}

                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#71717A]">
                          <span>Lead {SCORE_LABELS[item.score]}</span>
                          {item.nextFollowUpAt ? (
                            <span className="font-mono-tabular">{item.nextFollowUpAt}</span>
                          ) : null}
                        </div>

                        <select
                          aria-label={`Mover etapa de ${item.clientName}`}
                          value={item.stage}
                          onChange={async (e) => {
                            await movePipelineStage(item.id, e.target.value as PipelineStage);
                            await onRefresh();
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#18181B]"
                        >
                          {PIPELINE_STAGES.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. LEADS
  // =========================================================================
  if (section === 'leads') {
    return (
      <div className="space-y-5">
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome, telefone, origem ou UTM..."
            className="flex-1 min-w-[220px] px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
          />
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as typeof scoreFilter)}
            className="px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
          >
            <option value="todos">Todas as temperaturas</option>
            <option value="quente">Quente</option>
            <option value="morno">Morno</option>
            <option value="frio">Frio</option>
          </select>
        </div>

        <div className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E6E2DA] bg-[#FAF9F6] text-xs text-[#71717A]">
                  <th className="py-3 px-4 font-medium">Lead</th>
                  <th className="py-3 px-4 font-medium">Interesse</th>
                  <th className="py-3 px-4 font-medium">Origem / UTM</th>
                  <th className="py-3 px-4 font-medium">Score</th>
                  <th className="py-3 px-4 font-medium">Etapa</th>
                  <th className="py-3 px-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2DA]">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-[#71717A]">
                      Nenhum lead capturado ainda. Os formulários do site e landing page registram
                      leads automaticamente aqui.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#FAF9F6]/70">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#18181B]">{lead.name}</p>
                        <p className="text-xs text-[#52525B] font-mono-tabular">{lead.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#52525B]">
                        <p className="font-medium text-[#18181B]">
                          {lead.propertyTitle || lead.interestType}
                        </p>
                        {lead.preferredDate ? (
                          <p className="text-[#1E4D5C]">Visita: {lead.preferredDate}</p>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#52525B]">
                        <p>{lead.source}</p>
                        {lead.utmSource || lead.utmCampaign ? (
                          <p className="text-[11px] text-[#71717A]">
                            {[lead.utmSource, lead.utmCampaign].filter(Boolean).join(' / ')}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={lead.score}
                          onChange={async (e) => {
                            await updateLeadAdmin(lead.id, { score: e.target.value as LeadScore });
                            await onRefresh();
                          }}
                          className="px-2 py-1 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg"
                        >
                          <option value="quente">Quente</option>
                          <option value="morno">Morno</option>
                          <option value="frio">Frio</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={lead.status}
                          onChange={async (e) => {
                            await updateLeadAdmin(lead.id, {
                              status: e.target.value as PipelineStage
                            });
                            await onRefresh();
                          }}
                          className="px-2 py-1 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg"
                        >
                          {PIPELINE_STAGES.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <a
                            href={buildWhatsAppUrl(
                              lead.phone || whatsappNumber,
                              `Olá, ${lead.name}! Aqui é a Patrícia Vicente. Recebi seu contato pelo site.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[#E6E2DA] text-[#1E4D5C] hover:bg-[#F3F1EC]"
                            title="Responder no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            disabled={busyId === lead.id}
                            onClick={() => handleConvertLead(lead)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#1E4D5C] text-white rounded-lg cursor-pointer whitespace-nowrap"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Converter</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await removeLead(lead.id);
                              await onRefresh();
                            }}
                            className="p-1.5 text-[#A1A1AA] hover:text-[#DC2626] cursor-pointer"
                            title="Excluir lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. CLIENTS (Ficha Completa)
  // =========================================================================
  if (section === 'clients') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          <form
            onSubmit={handleCreateClient}
            className="bg-white border border-[#E6E2DA] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <input
              type="text"
              required
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Nome do cliente *"
              className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
            <input
              type="text"
              required
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              placeholder="Telefone / WhatsApp *"
              className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
            <input
              type="email"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              placeholder="E-mail"
              className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newClientBudget}
                onChange={(e) => setNewClientBudget(e.target.value)}
                placeholder="Faixa de orçamento"
                className="flex-1 px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
              />
              <button
                type="submit"
                disabled={busyId === 'new-client'}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer whitespace-nowrap"
              >
                Cadastrar
              </button>
            </div>
          </form>

          <div className="bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#E6E2DA]">
            {clients.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#71717A]">
                Nenhum cliente cadastrado ainda. Converta um lead ou cadastre manualmente.
              </div>
            ) : (
              clients.map((client) => (
                <div
                  key={client.id}
                  className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                    selectedClient?.id === client.id ? 'bg-[#F3F1EC]' : 'hover:bg-[#FAF9F6]'
                  }`}
                  onClick={() => setSelectedClient(client)}
                >
                  <div>
                    <p className="font-semibold text-sm text-[#18181B]">{client.name}</p>
                    <p className="text-xs text-[#52525B] font-mono-tabular">
                      {client.phone} · {SCORE_LABELS[client.score]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#1E4D5C] font-medium">
                      {PIPELINE_STAGES.find((s) => s.id === client.stage)?.label || client.stage}
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await removeClient(client.id);
                        if (selectedClient?.id === client.id) setSelectedClient(null);
                        await onRefresh();
                      }}
                      className="text-[#A1A1AA] hover:text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          {selectedClient ? (
            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-5 sticky top-6">
              <div className="space-y-1 border-b border-[#E6E2DA] pb-4">
                <p className="text-xs font-medium text-[#1E4D5C]">Ficha do Cliente</p>
                <h3 className="font-display text-2xl font-semibold text-[#18181B]">
                  {selectedClient.name}
                </h3>
                <p className="text-xs text-[#52525B] font-mono-tabular">
                  {selectedClient.phone} {selectedClient.email ? `· ${selectedClient.email}` : ''}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-[#71717A]">Registrar interação</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={interactionNote}
                      onChange={(e) => setInteractionNote(e.target.value)}
                      placeholder="Ex: Enviou plantas do condomínio..."
                      className="flex-1 px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={handleAddInteraction}
                      className="px-3 py-2 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </label>

                <div className="space-y-2 max-h-[260px] overflow-y-auto pt-2">
                  <p className="text-xs font-medium text-[#71717A]">Histórico de interações</p>
                  {(selectedClient.interactions || []).length === 0 ? (
                    <p className="text-xs text-[#A1A1AA]">Sem interações registradas.</p>
                  ) : (
                    (selectedClient.interactions || []).map((log, i) => (
                      <div
                        key={i}
                        className="text-xs text-[#52525B] bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl p-3"
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-8 text-center text-sm text-[#71717A]">
              Selecione um cliente à esquerda para abrir a ficha completa e o histórico de
              interações.
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. VISITS
  // =========================================================================
  if (section === 'visits') {
    return (
      <div className="space-y-6">
        <form
          onSubmit={handleCreateVisit}
          className="bg-white border border-[#E6E2DA] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        >
          <label className="space-y-1">
            <span className="text-xs font-medium text-[#71717A]">Cliente *</span>
            <input
              type="text"
              required
              value={visitClientName}
              onChange={(e) => setVisitClientName(e.target.value)}
              placeholder="Nome"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-[#71717A]">Telefone</span>
            <input
              type="text"
              value={visitClientPhone}
              onChange={(e) => setVisitClientPhone(e.target.value)}
              placeholder="(15) 99999-9999"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-[#71717A]">Imóvel *</span>
            <input
              type="text"
              required
              list="pv-properties-list"
              value={visitPropertyTitle}
              onChange={(e) => setVisitPropertyTitle(e.target.value)}
              placeholder="Escolha ou digite"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
            <datalist id="pv-properties-list">
              {properties.map((p) => (
                <option key={p.id} value={p.title} />
              ))}
            </datalist>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-[#71717A]">Data e horário *</span>
            <input
              type="datetime-local"
              required
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </label>
          <button
            type="submit"
            disabled={busyId === 'new-visit'}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer h-[38px]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agendar visita</span>
          </button>
        </form>

        <div className="bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#E6E2DA]">
          {visits.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717A]">
              Nenhuma visita agendada ainda. Ao agendar aqui, uma tarefa de lembrete é criada
              automaticamente.
            </div>
          ) : (
            visits.map((v) => (
              <div
                key={v.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#18181B]">
                    {v.clientName} · {v.propertyTitle}
                  </p>
                  <p className="text-xs text-[#52525B] font-mono-tabular">
                    {v.scheduledAt.replace('T', ' ')} ·{' '}
                    {v.reminderEnabled ? 'Lembrete ativo' : 'Sem lembrete'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={v.status}
                    onChange={async (e) => {
                      await saveVisit({ ...v, status: e.target.value as Visit['status'] });
                      await onRefresh();
                    }}
                    className="px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg"
                  >
                    <option value="agendada">Agendada</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="realizada">Realizada</option>
                    <option value="reagendada">Reagendada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeVisit(v.id);
                      await onRefresh();
                    }}
                    className="p-1.5 text-[#A1A1AA] hover:text-[#DC2626] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. PROPOSALS & DOCUMENTS
  // =========================================================================
  if (section === 'proposals') {
    return (
      <div className="space-y-6">
        <form
          onSubmit={handleCreateProposal}
          className="bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={proposalClientName}
              onChange={(e) => setProposalClientName(e.target.value)}
              placeholder="Cliente *"
              className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
            <input
              type="text"
              required
              value={proposalPropertyTitle}
              onChange={(e) => setProposalPropertyTitle(e.target.value)}
              placeholder="Imóvel / Unidade *"
              className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
            <input
              type="text"
              required
              value={proposalValue}
              onChange={(e) => setProposalValue(e.target.value)}
              placeholder="Valor da proposta *"
              className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <input
              type="text"
              value={proposalConditions}
              onChange={(e) => setProposalConditions(e.target.value)}
              placeholder="Condições de pagamento / observações"
              className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
            />
            <div className="flex items-center gap-3">
              <label className="flex-1 text-xs text-[#52525B] bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl px-3 py-2 cursor-pointer">
                <span>
                  {proposalFileUploading
                    ? 'Enviando documento...'
                    : proposalDocName || 'Anexar documento / PDF'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleProposalFileUpload}
                  className="hidden"
                />
              </label>
              <button
                type="submit"
                disabled={busyId === 'new-proposal'}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer whitespace-nowrap"
              >
                Registrar proposta
              </button>
            </div>
          </div>
        </form>

        <div className="bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#E6E2DA]">
          {proposals.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717A]">
              Nenhuma proposta registrada ainda.
            </div>
          ) : (
            proposals.map((prop) => (
              <div
                key={prop.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#18181B]">
                    {prop.clientName} · {prop.propertyTitle}
                  </p>
                  <p className="text-xs text-[#52525B]">
                    Valor: <strong className="tabular-nums">{prop.valueText}</strong>
                    {prop.paymentConditions ? ` · ${prop.paymentConditions}` : ''}
                  </p>
                  {prop.documentUrl && !prop.documentUrl.startsWith('local-doc://') ? (
                    <a
                      href={prop.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#1E4D5C] hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{prop.documentName || 'Documento anexo'}</span>
                    </a>
                  ) : prop.documentName ? (
                    <span className="text-xs text-[#71717A]">{prop.documentName}</span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={prop.status}
                    onChange={async (e) => {
                      await saveProposal({
                        ...prop,
                        status: e.target.value as Proposal['status']
                      });
                      await onRefresh();
                    }}
                    className="px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg"
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="enviada">Enviada</option>
                    <option value="em_analise">Em análise</option>
                    <option value="aceita">Aceita</option>
                    <option value="recusada">Recusada</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeProposal(prop.id);
                      await onRefresh();
                    }}
                    className="p-1.5 text-[#A1A1AA] hover:text-[#DC2626] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 6. TASKS & FOLLOW-UPS
  // =========================================================================
  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreateTask}
        className="bg-white border border-[#E6E2DA] rounded-2xl p-4 flex flex-wrap items-end gap-3"
      >
        <label className="flex-1 min-w-[220px] space-y-1">
          <span className="text-xs font-medium text-[#71717A]">Tarefa / Follow-up</span>
          <input
            type="text"
            required
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Ex: Retornar contato com cliente sobre planta"
            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
          />
        </label>
        <label className="w-40 space-y-1">
          <span className="text-xs font-medium text-[#71717A]">Prazo</span>
          <input
            type="date"
            value={taskDue}
            onChange={(e) => setTaskDue(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
          />
        </label>
        <label className="w-32 space-y-1">
          <span className="text-xs font-medium text-[#71717A]">Prioridade</span>
          <select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value as typeof taskPriority)}
            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl"
          >
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={busyId === 'new-task'}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#1E4D5C] rounded-xl cursor-pointer h-[38px]"
        >
          Criar tarefa
        </button>
      </form>

      <div className="bg-white border border-[#E6E2DA] rounded-2xl divide-y divide-[#E6E2DA]">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#71717A]">
            Nenhuma tarefa pendente. Tarefas automáticas também são criadas ao converter leads e
            agendar visitas.
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="p-4 flex items-center justify-between gap-4">
              <label className="flex items-start gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={async () => {
                    await saveTask({ ...task, completed: !task.completed });
                    await onRefresh();
                  }}
                  className="mt-1 rounded border-[#E6E2DA] text-[#1E4D5C]"
                />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      task.completed ? 'line-through text-[#A1A1AA]' : 'text-[#18181B]'
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-[#71717A]">
                    Prioridade {task.priority}
                    {task.dueDate ? ` · Prazo ${task.dueDate}` : ''}
                    {task.automationTrigger ? ` · Automação: ${task.automationTrigger}` : ''}
                  </p>
                </div>
              </label>

              <button
                type="button"
                onClick={async () => {
                  await removeTask(task.id);
                  await onRefresh();
                }}
                className="p-1.5 text-[#A1A1AA] hover:text-[#DC2626] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
