import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Plus, Calendar, Upload } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    occurred_at: '',
    location: '',
    description: '',
    severity: '',
    assigned_to: '',
    attachments: []
  });
  const [errors, setErrors] = useState({
    occurred_at: '',
    location: '',
    description: '',
    severity: '',
    assigned_to: '',
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
    if (showDialog) {
      fetchUsers();
    }
  }, [showDialog]);

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
      assigned_to: '', // Optional
      attachments: '' // Optional
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
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
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          form.append(key, value);
        }
      });
      
      // Add file attachments
      attachments.forEach((file, index) => {
        form.append(`attachments[${index}]`, file);
      });

      const response = await axiosMerchant.post("safety-incidents/store", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success(response.data.message);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
      e.target.reset();
      setAttachments([]);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Report Incident")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Report Safety Incident")}</DialogTitle>
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

          <div className="input-container">
            <label htmlFor="severity">{t("Severity")} <RequiredField /></label>
            <Select
              name="severity"
              options={severityOptions}
              value={severityOptions.find(opt => opt.value === formData.severity)}
              onChange={(selected) => {
                setFormData(prev => ({
                  ...prev,
                  severity: selected?.value || ''
                }));
                setErrors(prev => ({
                  ...prev,
                  severity: ''
                }));
              }}
              className="basic-multi-select"
              classNamePrefix="select"
              defaultValue={severityOptions[0]}
              placeholder={t("Select severity level")}
              aria-label={t("Severity")}
              error={errors.severity}
            />
            {errors.severity && (
              <p className="mt-1 text-sm text-red-500">{errors.severity}</p>
            )}
          </div>

          <div className="input-container">
            <label htmlFor="assigned_to">{t("Assign To")} ({t("Optional")})</label>
            <Select
              name="assigned_to"
              options={users?.map((user) => ({
                value: user.id,
                label: user.name,
              }))}
              value={users.find(user => user.id === formData.assigned_to)}
              onChange={(selected) => {
                setFormData(prev => ({
                  ...prev,
                  assigned_to: selected?.value || ''
                }));
                setErrors(prev => ({
                  ...prev,
                  assigned_to: ''
                }));
              }}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder={t("Select user to assign")}
              aria-label={t("Assigned To")}
              isClearable
            />
            {errors.assigned_to && (
              <p className="mt-1 text-sm text-red-500">{errors.assigned_to}</p>
            )}
          </div>

          <div className="input-container">
            <label htmlFor="attachments" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {t("Attachments")} ({t("Optional")})
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
              {t("Report Incident")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Create; 