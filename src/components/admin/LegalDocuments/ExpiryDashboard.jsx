import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, FileText, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import axiosMerchant from "@/axios";
import { handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";

const ExpiryDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({});
  const [expiringDocuments, setExpiringDocuments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsResponse, expiringResponse] = await Promise.all([
        axiosMerchant.get('legal-documents/statistics'),
        axiosMerchant.get('legal-documents/expiring')
      ]);
      
      setStatistics(statsResponse.data.data);
      setExpiringDocuments(expiringResponse.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Valid': return 'success';
      case 'Expired': return 'destructive';
      case 'Expiring Soon': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("Total Documents")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("Valid Documents")}</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.valid || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("Expiring Soon")}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.expiring_soon || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("Expired Documents")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.expired || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Documents */}
      {expiringDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              {t("Documents Requiring Attention")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringDocuments.map((document) => (
                <div 
                  key={document.id} 
                  className={`p-4 rounded-lg border ${
                    document.status === 'Expired' 
                      ? 'border-red-200 bg-red-50 dark:bg-red-900/10' 
                      : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium">{document.en_name}</h4>
                          <p className="text-sm text-gray-600">{document.ar_name}</p>
                        </div>
                        <Badge variant="outline">{document.type}</Badge>
                        <Badge variant={getStatusBadgeVariant(document.status)}>
                          {t(document.status)}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {t("Expires")}: {new Date(document.expiry_date).toLocaleDateString()}
                        </div>
                        {document.days_until_expiry >= 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {document.days_until_expiry} {t("days remaining")}
                          </div>
                        )}
                        {document.days_until_expiry < 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            {t("Expired")} {Math.abs(document.days_until_expiry)} {t("days ago")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/api/legal-documents/download/${document.id}`, '_blank')}
                      >
                        {t("View")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents by Type */}
      {statistics.by_type && Object.keys(statistics.by_type).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("Documents by Type")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statistics.by_type).map(([type, count]) => (
                <div key={type} className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-semibold">{count}</div>
                  <div className="text-sm text-gray-600">{t(type)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpiryDashboard; 