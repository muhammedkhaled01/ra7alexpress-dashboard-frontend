import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Calendar, Upload, X } from "lucide-react";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";

function Edit({ open, onClose, record, onSubmitSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    occurred_at: '',
    location: '',
    description: '',
    severity: 'Low',
    status: 'Open',
    assigned_to: '',
    investigation_notes: '',
  });
  const [errors, setErrors] = useState({
    occurred_at: '',
    location: '',
    description: '',
    severity: '',
    status: '',
    assigned_to: '',
    investigation_notes: '',
    attachments: ''
  });

  const { t } = useTranslation();

  const severityOptions = [
    { value: 'Low', label: t('Low') },
    { value: 'Medium', label: t('Medium') },
    { value: 'High', label: t('High') },
  ];

  const statusOptions = [
    { value: 'Open', label: t('Open') },
    { value: 'Under Investigation', label: t('Under Investigation') },
    { value: 'Resolved', label: t('Resolved') },
  ];

  useEffect(() => {
    if (open && record) {
      fetchUsers();
      // Format datetime for input
      const occurredAt = record.occurred_at ?
        new Date(record.occurred_at).toISOString().slice(0, 16) : '';

      setFormData({
        occurred_at: occurredAt,
        location: record.location || '',
        description: record.description || '',
        severity: record.severity || 'Low',
        status: record.status || 'Open',
        assigned_to: record.assigned_to || '',
        investigation_notes: record.investigation_notes || '',
      });
    }
  }, [open, record]);

  const fetchUsers = async () => {
    try {
      const response = await axiosMerchant.get('users/all');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {
      occurred_at: formData.occurred_at ? '' : t('Occurred At is required'),
      location: formData.location ? '' : t('Location is required'),
      description: formData.description ? '' : t('Description is required'),
      severity: formData.severity ? '' : t('Severity is required'),
      status: formData.status ? '' : t('Status is required'),
      assigned_to: formData.assigned_to ? '' : t('Assigned To is required'),
      investigation_notes: formData.investigation_notes ? '' : t('Investigation Notes are required'),
      attachments: '' // Optional
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Check file size (10MB max per file)
      const hasLargeFile = files.some(file => file.size > 10 * 1024 * 1024);
      if (hasLargeFile) {
        toast.error(t('File size exceeds 10MB limit'));
        return;
      }
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const hasInvalidType = files.some(file => !allowedTypes.includes(file.type));
      if (hasInvalidType) {
        toast.error(t('Invalid file type. Please upload JPG, PNG, PDF, DOC, or DOCX files only'));
        return;
      }
    }
    setAttachments(files);
    setErrors(prev => ({
      ...prev,
      attachments: ''
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form before submission
      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      const form = new FormData();

      // Add form data
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          form.append(key, formData[key]);
        }
      });

      form.append('id', record.id);

      // Add file attachments
      attachments.forEach((file, index) => {
        form.append(`attachments[${index}]`, file);
      });

      const response = await axiosMerchant.post("safety-incidents/update", form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(response.data.message);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
      setAttachments([]);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAttachment = async (attachmentId) => {
    try {
      await axiosMerchant.post(`safety-incidents/attachments/delete`, {
        id: attachmentId
      });
      toast.success(t('Attachment deleted successfully'));
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Edit Safety Incident")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-container">
            <label htmlFor="occurred_at" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t("Occurred At")} <RequiredField />
            </label>
            <Input
              id="occurred_at"
              name="occurred_at"
              type="datetime-local"
              value={formData.occurred_at}
              onChange={handleInputChange}
              className="cursor-pointer w-full"
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              error={errors.occurred_at}
            />
            {errors.occurred_at && (
              <p className="mt-1 text-sm text-red-500">{errors.occurred_at}</p>
            )}
          </div>

          <div className="input-container">
            <label htmlFor="location">{t("Location")} <RequiredField /></label>
            <Input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              placeholder={t("Enter incident location...")}
              error={errors.location}
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          <div className="input-container">
            <label htmlFor="description">{t("Description")} <RequiredField /></label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t("Describe what happened...")}
              rows={4}
              error={errors.description}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="input-container">
              <label htmlFor="severity">{t("Severity")} <RequiredField /></label>
              <Select
                name="severity"
                options={severityOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={severityOptions.find(opt => opt.value === formData.severity)}
                onChange={(selectedOption) => {
                  setFormData(prev => ({ ...prev, severity: selectedOption?.value || 'Low' }));
                  setErrors(prev => ({ ...prev, severity: '' }));
                }}
                placeholder={t("Select severity level")}
                aria-label={t("Severity")}
                error={errors.severity}
              />
              {errors.severity && (
                <p className="mt-1 text-sm text-red-500">{errors.severity}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="status">{t("Status")} <RequiredField /></label>
              <Select
                name="status"
                options={statusOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={statusOptions.find(opt => opt.value === formData.status)}
                onChange={(selectedOption) => {
                  setFormData(prev => ({ ...prev, status: selectedOption?.value || 'Open' }));
                  setErrors(prev => ({ ...prev, status: '' }));
                }}
                placeholder={t("Select status")}
                aria-label={t("Status")}
                error={errors.status}
              />
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status}</p>
              )}
            </div>
          </div>

          <div className="input-container">
            <label htmlFor="assigned_to">{t("Assign To")} <RequiredField /></label>
            <Select
              name="assigned_to"
              options={users?.map((user) => ({
                value: user.id,
                label: user.name,
              }))}
              className="basic-multi-select"
              classNamePrefix="select"
              value={users?.find(user => user.id == formData.assigned_to) ?
                { value: formData.assigned_to, label: users.find(user => user.id == formData.assigned_to)?.name } : null}
              onChange={(selectedOption) => {
                setFormData(prev => ({ ...prev, assigned_to: selectedOption?.value || '' }));
                setErrors(prev => ({ ...prev, assigned_to: '' }));
              }}
              defaultValue={{
                value: record.assigned_to,
                label: users.find(user => user.id == record.assigned_to)?.name
              }}
              placeholder={t("Select user to assign")}
              aria-label={t("Assigned To")}
              isClearable
              error={errors.assigned_to}
            />
            {errors.assigned_to && (
              <p className="mt-1 text-sm text-red-500">{errors.assigned_to}</p>
            )}
          </div>

          <div className="input-container">
            <label htmlFor="investigation_notes">{t("Investigation Notes")} <RequiredField /></label>
            <Textarea
              id="investigation_notes"
              name="investigation_notes"
              value={formData.investigation_notes}
              onChange={handleInputChange}
              placeholder={t("Add investigation notes...")}
              rows={3}
              error={errors.investigation_notes}
            />
            {errors.investigation_notes && (
              <p className="mt-1 text-sm text-red-500">{errors.investigation_notes}</p>
            )}
          </div>

          {/* Existing Attachments */}
          {record?.attachments && record.attachments.length > 0 && (
            <div className="input-container">
              <label>{t("Current Attachments")}</label>
              <div className="space-y-2">
                {record.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{attachment.original_name}</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/${attachment.file_path}`, '_blank')}
                      >
                        {t("View")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAttachment(attachment.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="input-container">
            <label htmlFor="attachments" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {t("Add New Attachments")} ({t("Optional")})
            </label>
            <Input
              id="attachments"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="cursor-pointer"
              error={errors.attachments}
            />
            {errors.attachments && (
              <p className="mt-1 text-sm text-red-500">{errors.attachments}</p>
            )}
            {attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {attachments.length} {t("file(s) selected")}:
                </p>
                <ul className="text-xs text-gray-500">
                  {attachments.map((file, index) => (
                    <li key={index}>• {file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-x-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("Cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("Update Incident")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Edit; 