import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  AlertCircle, 
  User, 
  FileText, 
  Download,
  EditIcon,
  Pencil
} from "lucide-react";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import { useTranslation } from "react-i18next";
import Edit from "./Edit";

const SafetyIncidentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const updateAbility = can("Safety Incident update");

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const fetchIncident = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`safety-incidents/show/${id}`);
      setIncident(response.data.data);
    } catch (error) {
      handleError(error);
      navigate('/safety-incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSuccess = () => {
    fetchIncident();
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[severity] || 'bg-gray-100 text-gray-800'}>
        {t(severity)}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Open': 'bg-blue-100 text-blue-800',
      'Under Investigation': 'bg-orange-100 text-orange-800',
      'Resolved': 'bg-green-100 text-green-800'
    };
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {t(status)}
      </Badge>
    );
  };


  const downloadAttachment = (attachment) => {
    console.log(attachment);
    const url = `${attachment.file_path}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">{t("Incident not found")}</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-x-4">
          <PageTitle title={`${t("Safety Incident")} #${incident.id}`} />
        </div>
        
        {updateAbility && (
          <Button 
            onClick={() => setEditDialogOpen(true)}
            className="flex items-center space-x-2"
          >
            <Pencil className="w-4 h-4" />
            <span>{t("Edit Incident")}</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{t("Incident Details")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">{t("Occurred At")}</p>
                    <p className="font-medium">
                      {new Date(incident.occurred_at).toLocaleDateString()} {new Date(incident.occurred_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">{t("Location")}</p>
                    <p className="font-medium">{incident.location}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("Severity")}</p>
                  {getSeverityBadge(incident.severity)}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("Status")}</p>
                  {getStatusBadge(incident.status)}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">{t("Description")}</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{incident.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Investigation Notes */}
          {incident.investigation_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>{t("Investigation Notes")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                  {incident.investigation_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {incident.attachments && incident.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>{t("Attachments")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {incident.attachments.map((attachment) => (
                    <div 
                      key={attachment.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => downloadAttachment(attachment)}
                    >
                      <div className="flex items-center space-x-3">
                        <Download className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium truncate">
                          {attachment.original_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* People Involved */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>{t("People Involved")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t("Reported By")}</p>
                <p className="font-medium">{incident.reported_by?.name || t("Unknown")}</p>
              </div>
              
              {incident.assigned_to && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("Assigned To")}</p>
                  <p className="font-medium">{incident.assigned_to.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{t("Timeline")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-l-2 border-gray-200 pl-3">
                <div className="pb-3">
                  <p className="text-sm font-medium">{t("Incident Created")}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(incident.created_at).toLocaleDateString()} {new Date(incident.created_at).toLocaleTimeString()}
                  </p>
                </div>
                
                {incident.updated_at !== incident.created_at && (
                  <div className="pb-3">
                    <p className="text-sm font-medium">{t("Last Updated")}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(incident.updated_at).toLocaleDateString()} {new Date(incident.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {editDialogOpen && (
        <Edit
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          record={incident}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  );
};

export default SafetyIncidentView; 