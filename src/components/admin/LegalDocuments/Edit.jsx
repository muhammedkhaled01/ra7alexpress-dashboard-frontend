import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import { handleError } from "@/utils/helpers";
import ImagePreview from "@/components/misc/ImagePreview";
import RequiredField from "@/components/misc/RequiredField";

// Document type options
const documentTypes = [
  { value: 'License', label: 'License' },
  { value: 'Permit', label: 'Permit' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Certificate', label: 'Certificate' },
  { value: 'Agreement', label: 'Agreement' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Registration', label: 'Registration' }
];

function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    document_id: record.document_id,
    document_name: record.document_name,
    type: record.type,
    expiry_date: new Date(record.expiry_date).toISOString().split('T')[0],
    file: null
  });
  const [errors, setErrors] = useState({
    document_id: '',
    document_name: '',
    type: '',
    expiry_date: '',
    file: ''
  });

  const validateForm = () => {
    const newErrors = {
      document_id: formData.document_id ? '' : t('Document ID is required'),
      document_name: formData.document_name ? '' : t('Document Name is required'),
      type: formData.type ? '' : t('Document Type is required'),
      expiry_date: formData.expiry_date ? '' : t('Expiry Date is required'),
      file: formData.file ? '' : '' // File is optional
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
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('File size exceeds 10MB limit'));
        return;
      }
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(t('Invalid file type. Please upload PDF, DOC, DOCX, JPG, JPEG, or PNG files only'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewFile(e.target.result);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({
        ...prev,
        file: file
      }));
      setErrors(prev => ({
        ...prev,
        file: ''
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      form.append('id', record.id);

      const response = await axiosMerchant.post(`legal-documents/update`, form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success(response.data.message || t('Legal Document updated successfully'));
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        onClose();
      }
    } catch (error) {
      handleError(error);
      console.error("Failed to submit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Update Legal Document")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="document_id">{t("Document ID")} <RequiredField /></label>
              <Input
                id="document_id"
                name="document_id"
                type="text"
                value={formData.document_id}
                onChange={handleInputChange}
                error={errors.document_id}
                placeholder={t("Enter Document ID...")}
              />
              {errors.document_id && (
                <p className="mt-1 text-sm text-red-500">{errors.document_id}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="document_name">{t("Document Name")} <RequiredField /></label>
              <Input
                id="document_name"
                name="document_name"
                type="text"
                value={formData.document_name}
                onChange={handleInputChange}
                error={errors.document_name}
                placeholder={t("Enter Document Name...")}
              />
              {errors.document_name && (
                <p className="mt-1 text-sm text-red-500">{errors.document_name}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="type">{t("Document Type")} <RequiredField /></label>
              <Select
                name="type"
                options={documentTypes}
                value={documentTypes.find(type => type.value === formData.type)}
                onChange={(selected) => {
                  setFormData(prev => ({
                    ...prev,
                    type: selected?.value || ''
                  }));
                  setErrors(prev => ({
                    ...prev,
                    type: ''
                  }));
                }}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder={t("Select Document Type")}
                aria-label={t("Document Type")}
                error={errors.type}
              />
              {errors.type && (
                <p className="mt-1 text-sm text-red-500">{errors.type}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="expiry_date">{t("Expiry Date")} <RequiredField /></label>
              <Input
                id="expiry_date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                placeholder={t("Select Expiry Date...")}
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                error={errors.expiry_date}
              />
              {errors.expiry_date && (
                <p className="mt-1 text-sm text-red-500">{errors.expiry_date}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="file">{t("Document File (Optional)")}</label>
              
              {/* Current File Preview */}
              {record.file_path && !previewFile && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2">{t("Current File")}</label>
                  <ImagePreview 
                    src={`${record.file_path}`}
                    alt={record.document_name}
                    fileName={record.file_path ? record.file_path.split('/').pop() : ''}
                  />
                </div>
              )}

              {/* New File Preview */}
              {previewFile && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2">{t("New File Preview")}</label>
                  <ImagePreview 
                    src={previewFile}
                    alt="New file preview"
                  />
                </div>
              )}

              <Input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                placeholder={t("Select Document File...")}
                onChange={handleFileChange}
                error={errors.file}
              />
              {errors.file && (
                <p className="mt-1 text-sm text-red-500">{errors.file}</p>
              )}
              <small className="text-gray-500 mt-1">
                {t("Leave empty to keep current file. Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max: 10MB)")}
              </small>
            </div>
          </div>
          
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("Close")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Update")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Edit; 