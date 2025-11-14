const handleSubmit = async () => {
  if (!formData.name || (mode === 'edit' && !editedZones[selectedZone.id])) return;

  try {
    setLoading(true);
    if (mode === 'edit') {
      const coords = editedZones[selectedZone.id];
      const wkt = `POLYGON((${
        coords.map(p => `${p.lng} ${p.lat}`).join(',')
      }))`;
      
      await axiosMerchant.post('/zones/update', {
        ...formData,
        coordinates: wkt,
        zone_id: selectedZone.id,
        state_id: state.id
      });
    }
    // ... rest of submit logic
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
};