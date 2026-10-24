import { useCallback, useEffect, useMemo, useState } from "react";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";

import {
  getAllRequests,
  getRequestById,
  getAssignmentCandidates,
  assignMaster,
  adminCancelRequest,
} from "../api/requestApi";

import "./RequestManagementPage.css";

const STATUS_LABELS = {
  WAITING_FOR_ASSIGNMENT: "Ожидает назначения",
  ASSIGNED: "Назначен мастер",
  ACCEPTED: "Мастер принял заявку",
  IN_PROGRESS: "В работе",
  COMPLETED: "Выполнена",
  CLOSED: "Закрыта",
  CANCELLED: "Отменена",
  REWORK_REQUESTED: "Требуется доработка",
};

const PRIORITY_STATUSES = ["WAITING_FOR_ASSIGNMENT", "ASSIGNED"];

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Неизвестно";
}

function getMasterName(master) {
  if (!master) return "Не назначен";

  if (typeof master === "string") {
    return master;
  }

  return [
    master.lastName,
    master.firstName,
    master.middleName,
  ]
    .filter(Boolean)
    .join(" ") || `Мастер #${master.id}`;
}

function getClientName(client) {
  if (!client) return "Не указан";

  return [
    client.lastName,
    client.firstName,
    client.middleName,
  ]
    .filter(Boolean)
    .join(" ") || `Клиент #${client.id}`;
}

function formatDate(value) {
  if (!value) return "Не указано";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getErrorMessage(error) {
  return error?.message || "Произошла ошибка. Попробуйте ещё раз.";
}

export default function RequestManagementPage() {
  const [user, setUser] = useState(null);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const isManager =
    user?.role === "ADMIN" ||
    user?.role === "DISPATCHER";

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAllRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const profile = await getCurrentProfile();
        setUser(profile);

        if (
          profile?.role !== "ADMIN" &&
          profile?.role !== "DISPATCHER"
        ) {
          setError("У вас нет доступа к управлению заявками.");
          setLoading(false);
          return;
        }

        await loadRequests();
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    }

    init();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...requests]
      .filter((request) => {
        if (
          statusFilter !== "ALL" &&
          request.status !== statusFilter
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const id = String(request.id ?? "");
        const clientName = getClientName(request.client).toLowerCase();
        const description = (
          request.problemDescription || ""
        ).toLowerCase();

        return (
          id.includes(normalizedSearch) ||
          clientName.includes(normalizedSearch) ||
          description.includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const aPriority = PRIORITY_STATUSES.includes(a.status) ? 0 : 1;
        const bPriority = PRIORITY_STATUSES.includes(b.status) ? 0 : 1;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        return new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0);
      });
  }, [requests, search, statusFilter]);

  async function openRequest(request) {
    setSelectedRequest(request);
    setDetails(null);
    setDetailsLoading(true);
    setNotice("");

    try {
      const data = await getRequestById(request.id);
      setDetails(data);
    } catch (err) {
      setNotice(getErrorMessage(err));
    } finally {
      setDetailsLoading(false);
    }
  }

  async function openAssignment() {
    if (!selectedRequest) return;

    setAssignmentOpen(true);
    setCandidates([]);
    setSelectedMasterId("");
    setCandidatesLoading(true);
    setNotice("");

    try {
      const data = await getAssignmentCandidates(selectedRequest.id);
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotice(getErrorMessage(err));
    } finally {
      setCandidatesLoading(false);
    }
  }

  async function handleAssignMaster() {
    if (!selectedRequest || !selectedMasterId) {
      setNotice("Выберите мастера.");
      return;
    }

    setActionLoading(true);
    setNotice("");

    try {
      await assignMaster(
        selectedRequest.id,
        Number(selectedMasterId)
      );

      setAssignmentOpen(false);
      setNotice("Мастер успешно назначен.");

      await loadRequests();

      const updatedDetails = await getRequestById(selectedRequest.id);
      setDetails(updatedDetails);

      setSelectedRequest((previous) => ({
        ...previous,
        ...updatedDetails,
      }));
    } catch (err) {
      setNotice(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelRequest() {
    if (!selectedRequest) return;

    const confirmed = window.confirm(
      `Отменить заявку №${selectedRequest.id}?`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setNotice("");

    try {
      await adminCancelRequest(selectedRequest.id);

      setNotice("Заявка отменена.");

      await loadRequests();

      const updatedDetails = await getRequestById(selectedRequest.id);
      setDetails(updatedDetails);
    } catch (err) {
      setNotice(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (!isManager && !loading && !user) {
    return (
      <div className="request-management-page">
        <div className="request-management-error">
          {error || "Нет доступа к странице."}
        </div>
      </div>
    );
  }

  return (
    <MainLayout user={user}>
      <div className="request-management-page">
        <div className="request-management-header">
          <div>
            <h1>Управление заявками</h1>
            <p>
              Назначение мастеров, переназначение и контроль заявок.
            </p>
          </div>

          <button
            type="button"
            className="request-management-refresh"
            onClick={loadRequests}
            disabled={loading}
          >
            Обновить
          </button>
        </div>

        {notice && (
          <div className="request-management-notice">
            {notice}
          </div>
        )}

        {error && (
          <div className="request-management-error">
            {error}
          </div>
        )}

        <div className="request-management-filters">
          <input
            type="text"
            placeholder="Поиск по номеру, клиенту или описанию"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">Все статусы</option>

            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="request-management-loading">
            Загрузка заявок...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="request-management-empty">
            Заявки не найдены.
          </div>
        ) : (
          <div className="request-management-list">
            {filteredRequests.map((request) => (
              <button
                type="button"
                key={request.id}
                className="request-management-card"
                onClick={() => openRequest(request)}
              >
                <div className="request-management-card-top">
                  <strong>Заявка №{request.id}</strong>

                  <span className={`request-status request-status-${request.status}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <div className="request-management-card-description">
                  {request.problemDescription || "Описание отсутствует"}
                </div>

                <div className="request-management-card-info">
                  <span>
                    Клиент: {getClientName(request.client)}
                  </span>

                  <span>
                    Мастер: {getMasterName(request.master)}
                  </span>

                  <span>
                    Дата: {formatDate(request.preferredVisitAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedRequest && (
          <div
            className="request-management-modal-overlay"
            onClick={() => {
              if (!actionLoading) {
                setSelectedRequest(null);
                setDetails(null);
                setAssignmentOpen(false);
              }
            }}
          >
            <div
              className="request-management-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="request-management-modal-header">
                <h2>Заявка №{selectedRequest.id}</h2>

                <button
                  type="button"
                  className="request-management-close"
                  onClick={() => {
                    if (!actionLoading) {
                      setSelectedRequest(null);
                      setDetails(null);
                      setAssignmentOpen(false);
                    }
                  }}
                  disabled={actionLoading}
                >
                  ×
                </button>
              </div>

              {detailsLoading ? (
                <div className="request-management-loading">
                  Загрузка карточки...
                </div>
              ) : details ? (
                <>
                  <div className="request-management-details">
                    <div>
                      <span>Статус</span>
                      <strong>{getStatusLabel(details.status)}</strong>
                    </div>

                    <div>
                      <span>Клиент</span>
                      <strong>{getClientName(details.client)}</strong>
                    </div>

                    <div>
                      <span>Телефон клиента</span>
                      <strong>{details.client?.phone || "Не указан"}</strong>
                    </div>

                    <div>
                      <span>Адрес</span>
                      <strong>
                        {details.address?.fullAddress ||
                          details.address?.address ||
                          details.address?.formattedAddress ||
                          details.addressId ||
                          "Не указан"}
                      </strong>
                    </div>

                    <div>
                      <span>Оборудование</span>
                      <strong>
                        {details.equipment?.name ||
                          details.equipment?.model ||
                          details.equipmentId ||
                          "Не указано"}
                      </strong>
                    </div>

                    <div>
                      <span>Мастер</span>
                      <strong>
                        {details.master
                          ? getMasterName(details.master)
                          : details.masterName ||
                            (details.masterId
                              ? `Мастер #${details.masterId}`
                              : "Не назначен")}
                      </strong>
                    </div>

                    <div>
                      <span>Предпочтительное время визита</span>
                      <strong>
                        {formatDate(details.preferredVisitAt)}
                      </strong>
                    </div>

                    <div>
                      <span>Описание проблемы</span>
                      <strong>
                        {details.problemDescription || "Не указано"}
                      </strong>
                    </div>

                    <div>
                      <span>Комментарий клиента</span>
                      <strong>
                        {details.clientComment || "Не указан"}
                      </strong>
                    </div>
                  </div>

                  {["WAITING_FOR_ASSIGNMENT", "ASSIGNED"].includes(
                    details.status
                  ) && (
                    <button
                      type="button"
                      className="request-management-primary"
                      onClick={openAssignment}
                      disabled={actionLoading}
                    >
                      {details.status === "WAITING_FOR_ASSIGNMENT"
                        ? "Назначить мастера"
                        : "Переназначить мастера"}
                    </button>
                  )}

                  {!["CANCELLED", "CLOSED"].includes(details.status) && (
                    <button
                      type="button"
                      className="request-management-danger"
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                    >
                      Отменить заявку
                    </button>
                  )}
                </>
              ) : (
                <div className="request-management-error">
                  Не удалось загрузить заявку.
                </div>
              )}

              {assignmentOpen && (
                <div className="request-management-assignment">
                  <h3>
                    {details?.status === "ASSIGNED"
                      ? "Переназначение мастера"
                      : "Назначение мастера"}
                  </h3>

                  {candidatesLoading ? (
                    <div className="request-management-loading">
                      Загрузка мастеров...
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="request-management-empty">
                      Нет доступных мастеров для назначения.
                    </div>
                  ) : (
                    <div className="request-management-candidates">
                      {candidates.map((master) => (
                        <label
                          key={master.id}
                          className={`request-management-candidate ${
                            String(selectedMasterId) === String(master.id)
                              ? "selected"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="master"
                            value={master.id}
                            checked={
                              String(selectedMasterId) === String(master.id)
                            }
                            onChange={() =>
                              setSelectedMasterId(String(master.id))
                            }
                          />

                          <div>
                            <strong>{getMasterName(master)}</strong>

                            <span>
                              Телефон: {master.phone || "Не указан"}
                            </span>

                            <span>
                              Активных заявок:{" "}
                              {master.activeRequestsCount ?? "Неизвестно"}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="request-management-assignment-actions">
                    <button
                      type="button"
                      className="request-management-secondary"
                      onClick={() => setAssignmentOpen(false)}
                      disabled={actionLoading}
                    >
                      Назад
                    </button>

                    <button
                      type="button"
                      className="request-management-primary"
                      onClick={handleAssignMaster}
                      disabled={
                        actionLoading ||
                        candidatesLoading ||
                        !selectedMasterId
                      }
                    >
                      {actionLoading
                        ? "Сохранение..."
                        : "Подтвердить назначение"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}