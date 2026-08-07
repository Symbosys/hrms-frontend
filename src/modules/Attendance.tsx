import {
  Camera,
  Check,
  Clock,
  Compass,
  Download,
  FileText,
  Filter,
  Lock,
  MapPin,
  Search,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import {
  useApplyRegularization,
  useCreateGeofence,
  useCreatePunch,
  useCreateShiftTiming,
  useDeleteGeofence,
  useDeleteShiftTiming,
  useGeofences,
  usePunches,
  useRegularizations,
  useRosters,
  useSaveRosters,
  useShiftTimings,
  useUpdateRegularization
} from '../api/hook/useAttendance';
import { useEmployees } from '../api/hook/useEmployee';
import { useApp } from '../context/AppContext';

import { useProfile } from '../api/hook/useAuth';

export const Attendance: React.FC = () => {
  const { activeSubModule, setActiveSubModule, addAuditLog, userRole, showConfirm, showAlert } = useApp();
  const { data: profileRes } = useProfile();
  const loggedUser = profileRes?.data?.user;

  // Active employee switcher
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Fetch employees list
  const { data: dbEmployeesRes, isLoading: employeesLoading } = useEmployees();
  const employeesList = dbEmployeesRes?.data || [];

  // Match logged in user's profile with employee record from DB
  const myEmployee = React.useMemo(() => {
    if (!loggedUser) return null;
    return employeesList.find(emp =>
      (loggedUser.employeeId && emp.id === loggedUser.employeeId) ||
      (loggedUser.id && emp.userId === loggedUser.id) ||
      (loggedUser.email && emp.email?.toLowerCase() === loggedUser.email.toLowerCase()) ||
      (loggedUser.phone && emp.phone === loggedUser.phone)
    ) || null;
  }, [employeesList, loggedUser]);

  const myEmpId = myEmployee?.id || loggedUser?.employeeId || loggedUser?.id || '';

  // Automatically select logged in user's employee record
  useEffect(() => {
    const isAdminOrHR = userRole === 'Super Admin' || userRole === 'HR Admin';
    if (myEmpId) {
      if (!selectedEmpId || (!isAdminOrHR && selectedEmpId !== myEmpId)) {
        setSelectedEmpId(myEmpId);
      }
    } else if (!selectedEmpId && profileRes && employeesList.length > 0) {
      setSelectedEmpId(employeesList[0].id);
    }
  }, [employeesList, loggedUser, myEmpId, profileRes, selectedEmpId, userRole]);

  const activeEmployee = employeesList.find(emp => emp.id === selectedEmpId) || myEmployee;

  // Queries & Mutations
  const { data: punchesRes, isLoading: punchesLoading } = usePunches(selectedEmpId);
  const punchLogList = punchesRes?.data || [];

  const { data: regularizeRes, isLoading: regsLoading } = useRegularizations();
  const regularizeRequests = regularizeRes?.data || [];

  const createPunchMut = useCreatePunch();
  const applyRegMut = useApplyRegularization();
  const updateRegMut = useUpdateRegularization();

  const { data: fencesRes, isLoading: fencesLoading } = useGeofences();
  const fencesList = fencesRes?.data || [];

  const createFenceMut = useCreateGeofence();
  const deleteFenceMut = useDeleteGeofence();

  // Organization Shift Timings Hooks & State
  const { data: shiftTimingsRes } = useShiftTimings();
  const createShiftTimingMut = useCreateShiftTiming();
  const deleteShiftTimingMut = useDeleteShiftTiming();

  const shiftTimingsList = shiftTimingsRes?.data || [];

  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftCode, setNewShiftCode] = useState('');
  const [newShiftStart, setNewShiftStart] = useState('09:30 AM');
  const [newShiftEnd, setNewShiftEnd] = useState('06:30 PM');
  const [newShiftColor, setNewShiftColor] = useState('#6366f1');

  // Shift Assignment States (Inside Add Shift & Standalone Modal)
  const [createAssignMode, setCreateAssignMode] = useState<'none' | 'single' | 'bulk'>('none');
  const [createAssignSingleEmpId, setCreateAssignSingleEmpId] = useState('');
  const [createAssignBulkEmpIds, setCreateAssignBulkEmpIds] = useState<string[]>([]);
  const [createAssignDays, setCreateAssignDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const [showAssignShiftModal, setShowAssignShiftModal] = useState(false);
  const [assignShiftTargetName, setAssignShiftTargetName] = useState('General');
  const [assignType, setAssignType] = useState<'single' | 'bulk'>('single');
  const [assignSingleEmpId, setAssignSingleEmpId] = useState('');
  const [assignBulkEmpIds, setAssignBulkEmpIds] = useState<string[]>([]);
  const [assignSelectedDays, setAssignSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const handleCreateShiftTiming = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName.trim() || !newShiftCode.trim()) {
      showAlert('Please enter Shift Name and Shift Code.', 'Validation Error', 'warning');
      return;
    }

    const codeUpper = newShiftCode.trim().toUpperCase().replace(/\s+/g, '_');
    const startHour = newShiftStart.trim().split(':')[0] || '09';
    const endHour = newShiftEnd.trim().split(':')[0] || '18';
    const shortLabel = `${codeUpper.slice(0, 3)} (${startHour}-${endHour})`;
    const shiftNameClean = newShiftName.trim();

    createShiftTimingMut.mutate(
      {
        code: codeUpper,
        name: shiftNameClean,
        startTime: newShiftStart.trim(),
        endTime: newShiftEnd.trim(),
        shortLabel,
        color: newShiftColor,
        bgColor: `${newShiftColor}18`,
        isSystem: false,
      },
      {
        onSuccess: () => {
          let assignedCount = 0;
          if (createAssignMode === 'single' && createAssignSingleEmpId) {
            setEmployeeShifts(prev => {
              const updated = { ...prev };
              const currentDays = updated[createAssignSingleEmpId] || { Mon: 'General', Tue: 'General', Wed: 'General', Thu: 'General', Fri: 'General', Sat: 'Week Off', Sun: 'Week Off' };
              const newDays = { ...currentDays };
              createAssignDays.forEach(day => { newDays[day] = shiftNameClean; });
              updated[createAssignSingleEmpId] = newDays;
              return updated;
            });
            assignedCount = 1;
          } else if (createAssignMode === 'bulk' && createAssignBulkEmpIds.length > 0) {
            setEmployeeShifts(prev => {
              const updated = { ...prev };
              createAssignBulkEmpIds.forEach(empId => {
                const currentDays = updated[empId] || { Mon: 'General', Tue: 'General', Wed: 'General', Thu: 'General', Fri: 'General', Sat: 'Week Off', Sun: 'Week Off' };
                const newDays = { ...currentDays };
                createAssignDays.forEach(day => { newDays[day] = shiftNameClean; });
                updated[empId] = newDays;
              });
              return updated;
            });
            assignedCount = createAssignBulkEmpIds.length;
          }

          addAuditLog('Created Organization Shift', 'Attendance Module', `Added new shift timing ${shiftNameClean} (${newShiftStart} - ${newShiftEnd})`);
          showAlert(
            `Organization shift "${shiftNameClean}" saved successfully${assignedCount > 0 ? ` and assigned to ${assignedCount} employee(s)!` : '!'}`,
            'Shift Added',
            'success'
          );
          setNewShiftName('');
          setNewShiftCode('');
          setCreateAssignMode('none');
          setCreateAssignSingleEmpId('');
          setCreateAssignBulkEmpIds([]);
          setShowAddShiftModal(false);
        },
        onError: (err: any) => {
          showAlert(err?.response?.data?.message || err.message || 'Failed to add shift', 'Error', 'danger');
        },
      }
    );
  };

  const handleApplyShiftAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignShiftTargetName) {
      showAlert('Please select a shift to assign.', 'Validation Error', 'warning');
      return;
    }
    if (assignSelectedDays.length === 0) {
      showAlert('Please select at least one day.', 'Validation Error', 'warning');
      return;
    }

    const targetEmpIds: string[] = [];
    if (assignType === 'single') {
      if (!assignSingleEmpId) {
        showAlert('Please select an employee.', 'Validation Error', 'warning');
        return;
      }
      targetEmpIds.push(assignSingleEmpId);
    } else {
      if (assignBulkEmpIds.length === 0) {
        showAlert('Please select at least one employee for bulk assignment.', 'Validation Error', 'warning');
        return;
      }
      targetEmpIds.push(...assignBulkEmpIds);
    }

    setEmployeeShifts(prev => {
      const updated = { ...prev };
      targetEmpIds.forEach(empId => {
        const currentDays = updated[empId] || { Mon: 'General', Tue: 'General', Wed: 'General', Thu: 'General', Fri: 'General', Sat: 'Week Off', Sun: 'Week Off' };
        const newDays = { ...currentDays };
        assignSelectedDays.forEach(day => { newDays[day] = assignShiftTargetName; });
        updated[empId] = newDays;
      });
      return updated;
    });

    const empCountStr = assignType === 'single' ? '1 employee' : `${targetEmpIds.length} employees`;
    addAuditLog('Assigned Shift Roster', 'Attendance Module', `Assigned ${assignShiftTargetName} shift to ${empCountStr} for days [${assignSelectedDays.join(', ')}]`);
    showAlert(`Successfully assigned "${assignShiftTargetName}" shift to ${empCountStr}!`, 'Shift Assigned', 'success');
    setShowAssignShiftModal(false);
  };

  const handleDeleteShiftTiming = (id: string, name: string) => {
    showConfirm({
      title: 'Delete Shift Timing',
      message: `Are you sure you want to remove "${name}" shift timing from your organization?`,
      type: 'confirm',
      confirmText: 'Delete',
      onConfirm: () => {
        deleteShiftTimingMut.mutate(id, {
          onSuccess: () => {
            addAuditLog('Deleted Organization Shift', 'Attendance Module', `Removed shift timing ${name}`);
            showAlert(`Shift "${name}" removed.`, 'Shift Removed', 'success');
          },
        });
      },
    });
  };

  // Shift & Geofence Validation for Punch Submit
  const validatePunchRestrictions = (): boolean => {
    // 1. SHIFT TIMING VALIDATION
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const empShiftToday = employeeShifts[selectedEmpId]?.[todayDayName] || 'General';

    if (empShiftToday === 'Week Off' || empShiftToday === 'OFF') {
      showAlert(
        `Today (${todayDayName}) is scheduled as your Week Off according to your assigned shift roster.`,
        'Week Off Restriction 🏖️',
        'warning'
      );
      return false;
    }

    // 2. GEOFENCE LOCATION VALIDATION
    if (fencesList.length > 0) {
      if (!activeFenceMatch || !activeFenceMatch.isInside) {
        const closestName = activeFenceMatch?.name || 'Authorized Office Location';
        const dist = activeFenceMatch?.distance || 0;
        const rad = activeFenceMatch?.radius || 100;

        showAlert(
          `Punch Restricted! You must be inside your designated geofence location (${closestName}). Current Distance: ${dist}m (Allowed Radius: ${rad}m).`,
          'Geofence Location Restriction 📍',
          'warning'
        );
        return false;
      }
    }

    return true;
  };

  // New Geofence Form State
  const [newFenceName, setNewFenceName] = useState('');
  const [newFenceLat, setNewFenceLat] = useState(23.357445);
  const [newFenceLng, setNewFenceLng] = useState(85.311484);
  const [newFenceRadius, setNewFenceRadius] = useState(100);


  // GPS Punch State
  const [gpsCoordinates, setGpsCoordinates] = useState({ lat: 23.357445, lng: 85.311484 });
  const [punchType, setPunchType] = useState<'In' | 'Out'>('In');
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Find matching or closest fence
  let activeFenceMatch: { name: string; distance: number; radius: number; isInside: boolean } | null = null;
  if (fencesList.length > 0) {
    let closestFence: any = null;
    let minDistance = Infinity;
    for (const fence of fencesList) {
      if (!fence.isActive) continue;
      const d = localDistance(gpsCoordinates.lat, gpsCoordinates.lng, fence.lat, fence.lng);
      if (d < minDistance) {
        minDistance = d;
        closestFence = fence;
      }
    }
    if (closestFence) {
      activeFenceMatch = {
        name: closestFence.name,
        distance: Math.round(minDistance),
        radius: closestFence.radius,
        isInside: minDistance <= closestFence.radius
      };
    }
  }
  const mapRef = useRef<HTMLDivElement | null>(null);
  const punchMapRef = useRef<HTMLDivElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const checkGoogle = () => {
      if ((window as any).google) {
        setMapLoaded(true);
        return;
      }
      setTimeout(checkGoogle, 100);
    };

    if (!(window as any).google) {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        checkGoogle();
      } else {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDp1m24jCv0artNLvNYGiRemEEjwAduk20`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
      }
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Update Config Map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !(window as any).google || activeSubModule !== 'geofence') return;

    const googleMaps = (window as any).google.maps;
    const mapCenter = { lat: newFenceLat, lng: newFenceLng };

    const map = new googleMaps.Map(mapRef.current, {
      center: mapCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    // Marker for the new/selected geofence center
    const activeMarker = new googleMaps.Marker({
      position: mapCenter,
      map: map,
      title: newFenceName || "Selected Geofence Center",
      icon: {
        path: googleMaps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        strokeColor: "#6366f1",
        fillColor: "#6366f1",
        fillOpacity: 0.8
      }
    });

    // Draw active fence circle
    const activeCircle = new googleMaps.Circle({
      strokeColor: "#6366f1",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#6366f1",
      fillOpacity: 0.15,
      map: map,
      center: mapCenter,
      radius: newFenceRadius
    });

    // Add markers and circles for existing geofences
    fencesList.forEach((fence: any) => {
      const fenceCenter = { lat: fence.lat, lng: fence.lng };
      
      // Existing fence circle
      new googleMaps.Circle({
        strokeColor: fence.isActive ? "#10b981" : "#64748b",
        strokeOpacity: 0.6,
        strokeWeight: 1.5,
        fillColor: fence.isActive ? "#10b981" : "#64748b",
        fillOpacity: 0.1,
        map: map,
        center: fenceCenter,
        radius: fence.radius
      });

      // Existing fence marker
      new googleMaps.Marker({
        position: fenceCenter,
        map: map,
        title: fence.name
      });
    });

    // Click map to set coordinates and resolve Location Name
    map.addListener("click", (e: any) => {
      if (e.latLng) {
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();
        setNewFenceLat(parseFloat(clickedLat.toFixed(6)));
        setNewFenceLng(parseFloat(clickedLng.toFixed(6)));

        const geocoder = new googleMaps.Geocoder();
        geocoder.geocode({ location: { lat: clickedLat, lng: clickedLng } }, (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            setNewFenceName(results[0].formatted_address);
          }
        });
      }
    });

  }, [mapLoaded, newFenceLat, newFenceLng, newFenceRadius, fencesList, activeSubModule]);

  // Update Punch Simulation Map
  useEffect(() => {
    if (!mapLoaded || !punchMapRef.current || !(window as any).google || activeSubModule !== 'punch') return;

    const googleMaps = (window as any).google.maps;
    const mapCenter = { lat: gpsCoordinates.lat, lng: gpsCoordinates.lng };

    const map = new googleMaps.Map(punchMapRef.current, {
      center: mapCenter,
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    // Marker for User simulated position
    new googleMaps.Marker({
      position: mapCenter,
      map: map,
      title: "Your Simulated Coordinates",
      icon: {
        path: googleMaps.SymbolPath.CIRCLE,
        scale: 8,
        strokeColor: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.9
      }
    });

    // Add circles for existing geofences
    fencesList.forEach((fence: any) => {
      const fenceCenter = { lat: fence.lat, lng: fence.lng };
      
      new googleMaps.Circle({
        strokeColor: fence.isActive ? "#10b981" : "#64748b",
        strokeOpacity: 0.5,
        strokeWeight: 1.5,
        fillColor: fence.isActive ? "#10b981" : "#64748b",
        fillOpacity: 0.08,
        map: map,
        center: fenceCenter,
        radius: fence.radius
      });
    });

    // Click map to simulate movement
    map.addListener("click", (e: any) => {
      if (e.latLng) {
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();
        setGpsCoordinates({
          lat: parseFloat(clickedLat.toFixed(6)),
          lng: parseFloat(clickedLng.toFixed(6))
        });
      }
    });

  }, [mapLoaded, gpsCoordinates, fencesList, activeSubModule]);

  const handleAutoDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          setGpsCoordinates({ lat, lng });
          setNewFenceLat(lat);
          setNewFenceLng(lng);

          // Reverse geocode to resolve Location Name
          if ((window as any).google) {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
              if (status === "OK" && results[0]) {
                setNewFenceName(results[0].formatted_address);
              }
            });
          }
        },
        (error) => {
          showAlert(`Failed to get location permission: ${error.message}`, "GPS Error", "warning");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      showAlert("Geolocation API is not supported in this browser.", "GPS Unsupported", "danger");
    }
  };

  // Automatic Location & Name Fetching on Load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          setGpsCoordinates({ lat, lng });
          setNewFenceLat(lat);
          setNewFenceLng(lng);

          const autoResolve = () => {
            if ((window as any).google) {
              const geocoder = new (window as any).google.maps.Geocoder();
              geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
                if (status === "OK" && results[0]) {
                  setNewFenceName(results[0].formatted_address);
                }
              });
            } else {
              setTimeout(autoResolve, 500);
            }
          };
          autoResolve();
        },
        (err) => {
          console.log("Automated location fetch failed:", err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [mapLoaded]);




  // Camera & Selfie Stream States using react-webcam
  const webcamRef = useRef<Webcam | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<'selfie' | 'password'>('selfie');
  const [isVerifyingLock, setIsVerifyingLock] = useState(false);

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setSelfiePreview(imageSrc);
      }
      setIsCameraActive(false);
    }
  };

  // New Regularization Request Form
  const [regDate, setRegDate] = useState('2026-07-01');
  const [regInTime, setRegInTime] = useState('09:30');
  const [regOutTime, setRegOutTime] = useState('18:30');
  const [regReason, setRegReason] = useState('Card not registered at turnstile');

  // Attendance Reports State
  const [reportMonth, setReportMonth] = useState('June');
  const [reportYear, setReportYear] = useState('2026');
  const [reportSearch, setReportSearch] = useState('');

  // Dynamic Roster Shift States & Backend API Hooks
  const [rosterWeek, setRosterWeek] = useState('Week 27 (Jul 1 - Jul 5)');
  const [rosterSearch, setRosterSearch] = useState('');
  const [employeeShifts, setEmployeeShifts] = useState<Record<string, Record<string, string>>>({});

  const { data: dbRostersRes, isLoading: rostersLoading } = useRosters(rosterWeek);
  const saveRostersMut = useSaveRosters();

  // Populate shift data from backend DB when fetched, or fallback to live employee defaults
  useEffect(() => {
    if (dbRostersRes?.data && dbRostersRes.data.length > 0) {
      const loaded: Record<string, Record<string, string>> = {};
      dbRostersRes.data.forEach(item => {
        loaded[item.employeeId] = {
          Mon: item.mon,
          Tue: item.tue,
          Wed: item.wed,
          Thu: item.thu,
          Fri: item.fri,
          Sat: item.sat,
          Sun: item.sun,
        };
      });
      setEmployeeShifts(loaded);
    } else if (employeesList.length > 0) {
      setEmployeeShifts(prev => {
        const updated = { ...prev };
        employeesList.forEach((emp, index) => {
          if (!updated[emp.id]) {
            updated[emp.id] = {
              Mon: 'General',
              Tue: 'General',
              Wed: 'General',
              Thu: 'General',
              Fri: 'General',
              Sat: index % 2 === 0 ? 'Week Off' : 'Morning',
              Sun: 'Week Off'
            };
          }
        });
        return updated;
      });
    }
  }, [dbRostersRes, employeesList]);

  const handleShiftChange = (empId: string, day: string, shiftVal: string) => {
    setEmployeeShifts(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || { Mon: 'General', Tue: 'General', Wed: 'General', Thu: 'General', Fri: 'General', Sat: 'Week Off', Sun: 'Week Off' }),
        [day]: shiftVal
      }
    }));
  };

  const handleSaveRoster = () => {
    const payloadRosters = Object.entries(employeeShifts).map(([empId, days]) => ({
      employeeId: empId,
      mon: days.Mon || 'General',
      tue: days.Tue || 'General',
      wed: days.Wed || 'General',
      thu: days.Thu || 'General',
      fri: days.Fri || 'General',
      sat: days.Sat || 'Week Off',
      sun: days.Sun || 'Week Off',
    }));

    showConfirm({
      title: "Publish Shift Roster",
      message: `Are you sure you want to save and publish the roster plan for ${payloadRosters.length} employees for ${rosterWeek}?`,
      type: "confirm",
      confirmText: "Publish Roster",
      onConfirm: () => {
        saveRostersMut.mutate({
          week: rosterWeek,
          rosters: payloadRosters,
        }, {
          onSuccess: () => {
            addAuditLog("Published Shift Roster", "Attendance Module", `Published weekly roster shifts for ${payloadRosters.length} employees for ${rosterWeek}.`);
            showAlert(`Weekly Roster Plan for ${rosterWeek} has been successfully saved to DB and published!`, "Roster Published", "success");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to save roster to backend", "Error", "danger");
          }
        });
      }
    });
  };

  // Attendance Calendar (Muster Roll) State & Dynamic Calculations
  const [musterMonth, setMusterMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [musterYear, setMusterYear] = useState<number>(new Date().getFullYear());
  const [musterEmpId, setMusterEmpId] = useState<string>('');

  // Keep musterEmpId updated with selectedEmpId if available
  useEffect(() => {
    if (selectedEmpId && !musterEmpId) {
      setMusterEmpId(selectedEmpId);
    }
  }, [selectedEmpId, musterEmpId]);

  const targetMusterEmpId = musterEmpId || selectedEmpId;
  const targetMusterEmployee = employeesList.find(e => e.id === targetMusterEmpId);

  // Dynamic day generation for selected month and year
  const daysInMusterMonth = new Date(musterYear, musterMonth + 1, 0).getDate();
  const firstDayOfWeekIndex = (new Date(musterYear, musterMonth, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Dynamic status computation for each day of the selected month
  const dynamicMusterDays: Array<{
    dayNum: number;
    dateStr: string;
    status: 'Present' | 'Late' | 'Absent' | 'Holiday' | 'WeekOff';
    punchesCount: number;
    regStatus?: string;
  }> = Array.from({ length: daysInMusterMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${musterYear}-${String(musterMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dateObj = new Date(musterYear, musterMonth, dayNum);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat

    // Check punches for this employee on this date
    const dayPunches = punchLogList.filter(log => {
      if (log.employeeId && log.employeeId !== targetMusterEmpId) return false;
      const logDateStr = log.createdAt ? new Date(log.createdAt).toISOString().split('T')[0] : '';
      return logDateStr === dateStr || log.time?.includes(`${monthNames[musterMonth].slice(0, 3)} ${dayNum}`);
    });

    // Check regularization requests
    const dayReg = regularizeRequests.find(req => {
      const isEmpMatch = !req.employeeId || req.employeeId === targetMusterEmpId || req.employeeName === targetMusterEmployee?.name;
      return isEmpMatch && req.date === dateStr;
    });

    let status: 'Present' | 'Late' | 'Absent' | 'Holiday' | 'WeekOff' = 'Present';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(musterYear, musterMonth, dayNum);
    checkDate.setHours(0, 0, 0, 0);

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      status = 'WeekOff';
    } else if (dayReg?.status === 'Approved') {
      status = 'Present';
    } else if (dayPunches.length > 0) {
      const firstIn = dayPunches.find(p => p.type === 'In');
      if (firstIn) {
        const inHour = new Date(firstIn.createdAt || Date.now()).getHours();
        status = inHour >= 10 ? 'Late' : 'Present';
      } else {
        status = 'Present';
      }
    } else {
      if (checkDate > today) {
        status = 'WeekOff';
      } else {
        // For past/current working days with no punches or approved regularization, mark as Absent
        status = 'Absent';
      }
    }

    return { dayNum, dateStr, status, punchesCount: dayPunches.length, regStatus: dayReg?.status };
  });

  const verifyWithScreenLock = async (): Promise<boolean> => {
    try {
      if (!window.PublicKeyCredential) {
        showAlert("WebAuthn is not supported on this browser.", "Unsupported Feature", "warning");
        return false;
      }
      
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        showAlert("Desktop Lock Screen verification (Windows Hello) is not available or enabled on this device.", "Device Lock Error", "warning");
        return false;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Symbosys HRMS Portal" },
          user: {
            id: userId,
            name: "employee",
            displayName: "Employee"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000
        }
      });

      return !!credential;
    } catch (err: any) {
      console.error("Lock screen verification failed:", err);
      showAlert("Verification failed: " + (err.message || "User cancelled lock screen prompt."), "Verification Failed", "danger");
      return false;
    }
  };

  const executePunch = () => {
    const targetEmpId = myEmpId || selectedEmpId;
    if (!targetEmpId) return;
    const methodStr = verifyMethod === 'selfie' ? "GPS + Selfie" : "GPS + Password";

    createPunchMut.mutate({
      employeeId: targetEmpId,
      type: punchType,
      method: methodStr,
      lat: gpsCoordinates.lat,
      lng: gpsCoordinates.lng,
      selfiePreview: verifyMethod === 'selfie' ? selfiePreview : null
    }, {
      onSuccess: () => {
        addAuditLog(
          `Attendance Punch ${punchType}`, 
          "Attendance Module", 
          `Self punch ${punchType} verified via GPS coordinates (Distance: ${activeFenceMatch?.distance || 0}m) and ${verifyMethod === 'selfie' ? 'liveliness face validation' : 'password authentication'}.`
        );
        showAlert(`Punch ${punchType} recorded successfully!`, "Punch Verified", "success");
        setIsCameraActive(false);
        setSelfiePreview(null);
      },
      onError: (err: any) => {
        showAlert(err?.response?.data?.message || err.message || "Failed to record punch", "Punch Error", "danger");
      }
    });
  };

  const handlePunchSubmit = async () => {
    if (!validatePunchRestrictions()) {
      return;
    }

    if (verifyMethod === 'selfie' && !selfiePreview) {
      showAlert('Please capture a selfie before verifying punch.', 'Selfie Required', 'warning');
      return;
    }
    
    if (verifyMethod === 'password') {
      setIsVerifyingLock(true);
      const isVerified = await verifyWithScreenLock();
      setIsVerifyingLock(false);
      
      if (isVerified) {
        executePunch();
      }
    } else {
      executePunch();
    }
  };

  const handleApplyRegularization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    applyRegMut.mutate({
      employeeId: selectedEmpId,
      date: regDate,
      timeIn: regInTime,
      timeOut: regOutTime,
      reason: regReason,
    }, {
      onSuccess: () => {
        addAuditLog("Regularization Request", "Attendance Module", `Applied regularization for date ${regDate}`);
        showAlert("Regularization request submitted successfully.", "Request Submitted", "success");
        setRegReason('');
      },
      onError: (err: any) => {
        showAlert(err?.response?.data?.message || err.message || "Failed to apply regularization", "Error", "danger");
      }
    });
  };

  const handleApproveReg = (id: string, name: string, date: string) => {
    updateRegMut.mutate({ id, status: 'Approved' }, {
      onSuccess: () => {
        addAuditLog("Approved Regularization", "Attendance Module", `Approved regularization request for ${name} on ${date}`);
        showAlert("Regularization request approved.", "Approved", "success");
      }
    });
  };

  const handleRejectReg = (id: string, name: string, date: string) => {
    updateRegMut.mutate({ id, status: 'Rejected' }, {
      onSuccess: () => {
        addAuditLog("Rejected Regularization", "Attendance Module", `Rejected regularization request for ${name} on ${date}`);
        showAlert("Regularization request rejected.", "Rejected", "info");
      }
    });
  };

  const handleAddGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFenceName) {
      showAlert("Please enter a geofence location name", "Missing Input", "warning");
      return;
    }
    createFenceMut.mutate({
      name: newFenceName,
      lat: newFenceLat,
      lng: newFenceLng,
      radius: newFenceRadius,
    }, {
      onSuccess: () => {
        showAlert("Geofence location registered successfully!", "Geofence Registered", "success");
        setNewFenceName('');
      },
      onError: (err: any) => {
        showAlert(err?.response?.data?.message || err.message || "Failed to create geofence", "Error", "danger");
      }
    });
  };

  const handleDeleteGeofence = (id: string, name: string) => {
    showConfirm({
      title: "Delete Geofence Location",
      message: `Are you sure you want to remove geofence location "${name}"?`,
      type: "danger",
      confirmText: "Delete Geofence",
      onConfirm: () => {
        deleteFenceMut.mutate(id, {
          onSuccess: () => {
            showAlert("Geofence deleted successfully.", "Deleted", "success");
          }
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button 
          onClick={() => setActiveSubModule('punch')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'punch' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          GPS / Selfie Punch
        </button>
        <button 
          onClick={() => setActiveSubModule('roster')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'roster' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Shift & Roster Planning
        </button>
        <button 
          onClick={() => setActiveSubModule('regularize')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'regularize' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Regularization Requests
        </button>
        <button 
          onClick={() => setActiveSubModule('muster')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'muster' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Muster Roll Calendar
        </button>
        <button 
          onClick={() => setActiveSubModule('reports')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'reports' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Attendance Reports
        </button>
        <button 
          onClick={() => setActiveSubModule('geofence')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'geofence' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Geofencing Config
        </button>
      </div>

      {/* Global Simulated User Switcher */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Simulate as Employee</h4>
            <p className="text-slate-450 mt-0.5">Switch profiles to change who punches check-in/out logs or files regularization requests.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-3.5 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-750 dark:text-slate-300 font-semibold focus:outline-none"
          >
            {employeesLoading ? (
              <option>Loading employees...</option>
            ) : (
              employeesList.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.designation || 'Staff'})
                </option>
              ))
            )}
          </select>

          {activeEmployee && (
            <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-355 rounded-xl font-bold uppercase text-[10px]">
              {activeEmployee.department?.name || 'Operations'}
            </span>
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* 1. GPS / SELFIE PUNCH SIMULATOR         */}
      {/* ======================================= */}
      {activeSubModule === 'punch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-xs">
          
          {/* Left panel (col-span-5): Punch settings, verification & submit */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Main Action card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center justify-between">
                <span>GPS Mobile Punch Card</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold uppercase">
                  Simulated Device
                </span>
              </h3>

              {/* Punch Toggle */}
              <div className="flex bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden p-1 border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setPunchType('In')}
                  className={`w-full py-2 rounded-lg font-bold text-xs transition-all ${
                    punchType === 'In' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  PUNCH IN
                </button>
                <button 
                  onClick={() => setPunchType('Out')}
                  className={`w-full py-2 rounded-lg font-bold text-xs transition-all ${
                    punchType === 'Out' 
                      ? 'bg-rose-500 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  PUNCH OUT
                </button>
              </div>

              {/* Verification Section */}
              <div className="space-y-3">
                <label className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Verification Method</label>
                <div className="flex bg-slate-100 dark:bg-slate-950 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800 text-[10px]">
                  <button 
                    type="button"
                    onClick={() => setVerifyMethod('selfie')}
                    className={`w-1/2 py-1.5 rounded font-bold transition-all ${
                      verifyMethod === 'selfie' 
                        ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-white' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Selfie Camera
                  </button>
                  <button 
                    type="button"
                    onClick={() => setVerifyMethod('password')}
                    className={`w-1/2 py-1.5 rounded font-bold transition-all ${
                      verifyMethod === 'password' 
                        ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-white' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Password Auth
                  </button>
                </div>

                {verifyMethod === 'selfie' ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center bg-slate-50 dark:bg-slate-950/40 relative overflow-hidden h-44 flex flex-col justify-center items-center">
                    {selfiePreview ? (
                      <>
                        <img src={selfiePreview} alt="Selfie Verification" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-green-400 font-bold bg-black/60 px-3 py-1 rounded-full flex items-center gap-1.5 border border-green-500/35">
                            <Check className="h-4 w-4 animate-bounce" />
                            Face Confirmed
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelfiePreview(null);
                            setIsCameraActive(false);
                          }}
                          className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/95 transition-all z-10"
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : isCameraActive ? (
                      <>
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                          videoConstraints={{
                            facingMode: "user"
                          }}
                        />
                        <div className="absolute bottom-2 inset-x-0 flex justify-center z-10">
                          <button 
                            onClick={capturePhoto}
                            className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold shadow-md text-[10px]"
                            type="button"
                          >
                            Capture Photo
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-slate-400 mb-2" />
                        <button 
                          onClick={() => setIsCameraActive(true)}
                          className="px-3.5 py-1.5 bg-primary text-white rounded-lg font-bold hover:scale-105 transition-all text-[10px]"
                          type="button"
                        >
                          Capture Mock Selfie
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950 relative h-44 flex flex-col justify-center items-center text-center space-y-3">
                    <div className="p-2.5 bg-primary/10 rounded-full text-primary">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white block text-xs">Verify Desktop Screen Lock</span>
                      <span className="text-[10px] text-slate-400 block max-w-[220px] mt-1">Requires your OS lock screen PIN or password authentication to verify GPS punch.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* GPS Simulator Coordinates */}
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 bg-slate-50/50 dark:bg-slate-950/50">
                <span className="font-bold text-[10px] text-slate-400 uppercase block tracking-wider">Simulated Phone GPS Locator</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={gpsCoordinates.lat}
                      onChange={(e) => setGpsCoordinates({ ...gpsCoordinates, lat: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={gpsCoordinates.lng}
                      onChange={(e) => setGpsCoordinates({ ...gpsCoordinates, lng: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  className="w-full mt-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Auto-Detect Current GPS</span>
                </button>
              </div>

              {/* Geofence Status */}
              <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider">Geofence Status</span>
                  {fencesLoading ? (
                    <span className="text-slate-400">LOADING FENCES...</span>
                  ) : activeFenceMatch ? (
                    activeFenceMatch.isInside ? (
                      <span className="text-emerald-500 flex items-center gap-1.5">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>
                        MATCHED
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1.5">
                        OUT OF RANGE
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400">NO FENCES FOUND</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 space-y-1 mt-1">
                  {activeFenceMatch ? (
                    activeFenceMatch.isInside ? (
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        You are inside "{activeFenceMatch.name}" ({activeFenceMatch.distance}m away; limit: {activeFenceMatch.radius}m).
                      </p>
                    ) : (
                      <p className="text-rose-500 font-semibold">
                        You are outside "{activeFenceMatch.name}" ({activeFenceMatch.distance}m away; limit: {activeFenceMatch.radius}m).
                      </p>
                    )
                  ) : (
                    <p className="text-slate-450 italic">No active geofence locations exist. Please configure one in the Geofencing Config tab.</p>
                  )}
                </div>
              </div>

              <button 
                onClick={handlePunchSubmit}
                disabled={isVerifyingLock || createPunchMut.isPending}
                className={`w-full py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all ${
                  isVerifyingLock ? 'bg-slate-400 cursor-not-allowed text-white shadow-none' :
                  punchType === 'In' ? 'bg-primary text-white shadow-primary/20' : 'bg-rose-500 text-white shadow-rose-500/20'
                }`}
              >
                {isVerifyingLock ? 'Verifying Lock Screen...' : createPunchMut.isPending ? 'Syncing...' : 'Verify Punch & Sync'}
              </button>
            </div>

          </div>

          {/* Right panel (col-span-7): Large Map and History list */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Google Map Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Real-time Location Verification</h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">Displays geofence regions. Click on the map to manually override and verify GPS.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>Your Position</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>Office Geofences</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
                    className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Compass className="h-3.5 w-3.5 text-white" />
                    <span>Fetch Current Location</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner relative h-[400px] bg-slate-100 dark:bg-slate-950">
                <div ref={punchMapRef} className="w-full h-full" />
                
                {/* Floating Map Controls */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg font-bold text-[9px] flex items-center gap-1 select-none pointer-events-none border border-white/5 z-10">
                  <MapPin className="h-3.5 w-3.5 text-blue-400 animate-bounce" />
                  <span>Click map to set simulated location</span>
                </div>

                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  className="absolute top-3 right-3 z-10 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-extrabold text-xs rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Fetch your exact current GPS coordinates"
                >
                  <Compass className="h-4 w-4 text-primary" />
                  <span>Fetch Current Location</span>
                </button>
              </div>
            </div>

            {/* Session Logs Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center justify-between">
                <span>Session Punch Register</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                  Punch History ({punchLogList.length})
                </span>
              </h3>
              
              {punchesLoading ? (
                <div className="py-8 text-center text-slate-400 font-medium">Loading session logs...</div>
              ) : punchLogList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium italic">No check-in or out punches recorded yet.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  {punchLogList.map((log) => (
                    <div key={log.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 gap-4 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          log.type === 'In' 
                            ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' 
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}>
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">Punch {log.type === 'In' ? 'Check-In' : 'Check-Out'}</p>
                          <p className="text-[10px] text-slate-450 mt-0.5" title={`${log.method} • GPS: ${log.lat}, ${log.lng}`}>
                            {log.method} • {log.lat}, {log.lng}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold text-xs shrink-0 ${log.time.startsWith('Today') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>{log.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ======================================= */}
      {/* 2. SHIFT & ROSTER PLANNING              */}
      {/* ======================================= */}
      {activeSubModule === 'roster' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in text-xs">
          
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <span>Shift Planner & Team Roster</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {employeesList.length} Active Staff
                </span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Assign custom shifts to employees weekly with real-time audit trail syncing.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Employee Filter */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search staff..." 
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 text-xs w-40 md:w-48" 
                />
              </div>

              {/* Week Selector */}
              <select 
                value={rosterWeek} 
                onChange={(e) => setRosterWeek(e.target.value)}
                className="px-3 py-1.5 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300 font-bold focus:outline-none text-xs"
              >
                <option value="Week 27 (Jul 1 - Jul 5)">Week 27 (Jul 1 - Jul 5)</option>
                <option value="Week 28 (Jul 6 - Jul 12)">Week 28 (Jul 6 - Jul 12)</option>
                <option value="Week 29 (Jul 13 - Jul 19)">Week 29 (Jul 13 - Jul 19)</option>
                <option value="Week 30 (Jul 20 - Jul 26)">Week 30 (Jul 20 - Jul 26)</option>
              </select>

              {/* Add Shift Button */}
              <button
                type="button"
                onClick={() => setShowAddShiftModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm hover:shadow transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5 text-white" />
                <span>+ Add Shift</span>
              </button>

              {/* Assign Shift Button (Single & Bulk) */}
              <button
                type="button"
                onClick={() => {
                  setAssignShiftTargetName(shiftTimingsList[0]?.name || 'General');
                  setShowAssignShiftModal(true);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm hover:shadow transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="h-3.5 w-3.5 text-white" />
                <span>⚡ Assign Shift</span>
              </button>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveRoster}
                disabled={saveRostersMut.isPending}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="h-4 w-4 text-white" />
                <span>{saveRostersMut.isPending ? 'Saving to DB...' : 'Save & Publish Roster'}</span>
              </button>
            </div>
          </div>

          {/* Shift Timing Legend & Organization Shift Cards */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px]">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[9px]">Organization Shift Timings:</span>
            {shiftTimingsList.length > 0 ? (
              shiftTimingsList.map(st => (
                <span
                  key={st.id || st.code}
                  className="px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 border shadow-2xs"
                  style={{ backgroundColor: st.bgColor || '#eef2ff', color: st.color || '#4f46e5', borderColor: st.color || '#6366f1' }}
                >
                  <span>{st.name} ({st.startTime} - {st.endTime})</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteShiftTiming(st.id, st.name)}
                    className="text-red-500 hover:text-red-700 font-extrabold ml-1 cursor-pointer"
                    title="Remove shift timing"
                  >
                    ✕
                  </button>
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic text-[11px]">
                No organization shifts added yet. Click "+ Add Shift" to add custom shifts.
              </span>
            )}
          </div>

          {/* Add Shift Timing Modal */}
          {showAddShiftModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    <span>Add Organization Shift Timing</span>
                  </h3>
                  <button onClick={() => setShowAddShiftModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateShiftTiming} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase text-[10px]">Shift Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. General Shift, Early Morning, Split Shift"
                      value={newShiftName}
                      onChange={(e) => setNewShiftName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase text-[10px]">Shift Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. GENERAL, FLEXI, MORNING"
                      value={newShiftCode}
                      onChange={(e) => setNewShiftCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold uppercase text-[10px]">Start Time *</label>
                      <input
                        type="text"
                        placeholder="09:30 AM"
                        value={newShiftStart}
                        onChange={(e) => setNewShiftStart(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold uppercase text-[10px]">End Time *</label>
                      <input
                        type="text"
                        placeholder="06:30 PM"
                        value={newShiftEnd}
                        onChange={(e) => setNewShiftEnd(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Optional Employee Shift Assignment during Creation */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <label className="text-slate-700 dark:text-slate-300 font-bold text-xs block">
                      Assign Shift to Employee(s) <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCreateAssignMode('none')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer ${createAssignMode === 'none' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}
                      >
                        Don't Assign
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateAssignMode('single')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer ${createAssignMode === 'single' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}
                      >
                        Single Employee
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateAssignMode('bulk')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer ${createAssignMode === 'bulk' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}
                      >
                        Bulk Employees
                      </button>
                    </div>

                    {createAssignMode === 'single' && (
                      <div className="space-y-1">
                        <label className="text-slate-500 font-medium text-[10px]">Select Employee:</label>
                        <select
                          value={createAssignSingleEmpId}
                          onChange={(e) => setCreateAssignSingleEmpId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="">-- Choose Employee --</option>
                          {employeesList.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.id}) - {emp.designation || 'Staff'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {createAssignMode === 'bulk' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-500 font-medium text-[10px]">Select Employees ({createAssignBulkEmpIds.length} selected):</label>
                          <button
                            type="button"
                            onClick={() => {
                              if (createAssignBulkEmpIds.length === employeesList.length) {
                                setCreateAssignBulkEmpIds([]);
                              } else {
                                setCreateAssignBulkEmpIds(employeesList.map(e => e.id));
                              }
                            }}
                            className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px] hover:underline cursor-pointer"
                          >
                            {createAssignBulkEmpIds.length === employeesList.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="max-h-32 overflow-y-auto border rounded-xl p-2 bg-white dark:bg-slate-900 space-y-1">
                          {employeesList.map(emp => (
                            <label key={emp.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={createAssignBulkEmpIds.includes(emp.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCreateAssignBulkEmpIds(prev => [...prev, emp.id]);
                                  } else {
                                    setCreateAssignBulkEmpIds(prev => prev.filter(id => id !== emp.id));
                                  }
                                }}
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{emp.name}</span>
                              <span className="text-[10px] text-slate-400">({emp.id})</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {createAssignMode !== 'none' && (
                      <div className="space-y-1 pt-1">
                        <label className="text-slate-500 font-medium text-[10px]">Assign Days:</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                setCreateAssignDays(prev => 
                                  prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                                );
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${createAssignDays.includes(day) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddShiftModal(false)}
                      className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createShiftTimingMut.isPending}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {createShiftTimingMut.isPending ? 'Saving...' : 'Save Organization Shift'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Standalone Single & Bulk Shift Assignment Modal */}
          {showAssignShiftModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>Assign Shift to Employee(s)</span>
                  </h3>
                  <button onClick={() => setShowAssignShiftModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleApplyShiftAssignment} className="space-y-4">
                  {/* Select Shift */}
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase text-[10px]">Select Shift to Assign *</label>
                    <select
                      value={assignShiftTargetName}
                      onChange={(e) => setAssignShiftTargetName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none font-bold"
                    >
                      <option value="General">General (09:30 AM - 06:30 PM)</option>
                      <option value="Morning">Morning (06:00 AM - 02:30 PM)</option>
                      <option value="Evening">Evening (02:00 PM - 10:30 PM)</option>
                      <option value="Night">Night (10:00 PM - 06:30 AM)</option>
                      <option value="Week Off">Week Off</option>
                      {shiftTimingsList.map(st => (
                        <option key={st.id || st.name} value={st.name}>
                          {st.name} ({st.startTime} - {st.endTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assignment Type Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase text-[10px]">Assignment Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignType('single')}
                        className={`py-2 px-3 rounded-xl font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${assignType === 'single' ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}
                      >
                        <span>Single Employee</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignType('bulk')}
                        className={`py-2 px-3 rounded-xl font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${assignType === 'bulk' ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}
                      >
                        <span>Bulk Employees ({assignBulkEmpIds.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Employee Selection */}
                  {assignType === 'single' ? (
                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold uppercase text-[10px]">Select Employee *</label>
                      <select
                        value={assignSingleEmpId}
                        onChange={(e) => setAssignSingleEmpId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="">-- Choose Employee --</option>
                        {employeesList.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.id}) - {emp.designation || 'Staff'}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-500 font-bold uppercase text-[10px]">Select Employees ({assignBulkEmpIds.length} Selected) *</label>
                        <button
                          type="button"
                          onClick={() => {
                            if (assignBulkEmpIds.length === employeesList.length) {
                              setAssignBulkEmpIds([]);
                            } else {
                              setAssignBulkEmpIds(employeesList.map(e => e.id));
                            }
                          }}
                          className="text-purple-600 dark:text-purple-400 font-extrabold text-[10px] hover:underline cursor-pointer"
                        >
                          {assignBulkEmpIds.length === employeesList.length ? 'Deselect All' : 'Select All Employees'}
                        </button>
                      </div>

                      <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-950/50 space-y-1">
                        {employeesList.map(emp => (
                          <label key={emp.id} className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={assignBulkEmpIds.includes(emp.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignBulkEmpIds(prev => [...prev, emp.id]);
                                } else {
                                  setAssignBulkEmpIds(prev => prev.filter(id => id !== emp.id));
                                }
                              }}
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{emp.name}</span>
                              <span className="text-[10px] text-slate-400">{emp.id} • {emp.designation || 'Staff'}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Days Selection */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-500 font-bold uppercase text-[10px]">Select Target Days *</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAssignSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                        >
                          Mon-Fri
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                        >
                          All Days
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setAssignSelectedDays(prev => 
                              prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl font-extrabold border text-xs cursor-pointer transition-all ${assignSelectedDays.includes(day) ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAssignShiftModal(false)}
                      className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      Apply & Assign Shift
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Dynamic Employee Roster Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto shadow-inner">
            <table className="w-full text-xs text-left min-w-[850px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3 min-w-[200px]">Employee Profile</th>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <th key={day} className="p-3 text-center min-w-[105px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-650 dark:text-slate-350">
                {employeesLoading || rostersLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                      Loading roster staff database...
                    </td>
                  </tr>
                ) : employeesList.filter(e => e.name.toLowerCase().includes(rosterSearch.toLowerCase()) || e.id.toLowerCase().includes(rosterSearch.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold italic">
                      No matching staff found for "{rosterSearch}".
                    </td>
                  </tr>
                ) : (
                  employeesList
                    .filter(e => e.name.toLowerCase().includes(rosterSearch.toLowerCase()) || e.id.toLowerCase().includes(rosterSearch.toLowerCase()))
                    .map((emp) => {
                      const shiftsForEmp = employeeShifts[emp.id] || {
                        Mon: 'General', Tue: 'General', Wed: 'General', Thu: 'General', Fri: 'General', Sat: 'Week Off', Sun: 'Week Off'
                      };

                      const getShiftStyle = (val: string) => {
                        switch (val) {
                          case 'Morning': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
                          case 'Evening': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
                          case 'Night': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
                          case 'Week Off': return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                          default: return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
                        }
                      };

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0">
                                {emp.name?.charAt(0) || 'E'}
                              </div>
                              <div className="truncate">
                                <span className="font-extrabold text-slate-800 dark:text-white block truncate">{emp.name}</span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {emp.id} • {emp.designation || 'Staff'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                            const val = shiftsForEmp[day] || 'General';
                            return (
                              <td key={day} className="p-2 text-center">
                                <select
                                  value={val}
                                  onChange={(e) => handleShiftChange(emp.id, day, e.target.value)}
                                  className={`w-full text-[11px] font-extrabold px-2 py-1 rounded-lg border focus:outline-none text-center cursor-pointer transition-all ${getShiftStyle(val)}`}
                                >
                                  <option value="General" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">General</option>
                                  <option value="Morning" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Morning</option>
                                  <option value="Evening" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Evening</option>
                                  <option value="Night" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Night</option>
                                  <option value="Week Off" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Week Off</option>
                                  {shiftTimingsList.map(st => (
                                    <option key={st.id || st.code} value={st.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                      {st.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 3. ATTENDANCE REGULARIZATION            */}
      {/* ======================================= */}
      {activeSubModule === 'regularize' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          {/* Submit Request */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Apply Regularization</h3>
            
            <form onSubmit={handleApplyRegularization} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Select Missed Date</label>
                <input 
                  type="date" 
                  value={regDate} 
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Expected Time-In</label>
                  <input 
                    type="time" 
                    value={regInTime} 
                    onChange={(e) => setRegInTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Expected Time-Out</label>
                  <input 
                    type="time" 
                    value={regOutTime} 
                    onChange={(e) => setRegOutTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Reason for Regularization</label>
                <textarea 
                  value={regReason} 
                  onChange={(e) => setRegReason(e.target.value)}
                  placeholder="Explain why punch was missed..." 
                  rows={3} 
                  required 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              <button 
                type="submit" 
                disabled={applyRegMut.isPending}
                className="w-full py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md disabled:opacity-50"
              >
                {applyRegMut.isPending ? "Submitting..." : "Submit Regularization Request"}
              </button>
            </form>
          </div>

          {/* Pending / Historic Requests */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2">Regularization History Log</h3>
            
            {regsLoading ? (
              <div className="py-8 text-center text-slate-400 font-medium">Loading history logs...</div>
            ) : regularizeRequests.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No regularization logs found.</p>
            ) : (
              <div className="space-y-3.5">
                {regularizeRequests.map((req) => (
                  <div key={req.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">{req.employeeName}</span>
                        <span className="text-[10px] text-slate-450">{req.date}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Expected In: <span className="font-semibold text-slate-700 dark:text-slate-200">{req.timeIn}</span> • Out: <span className="font-semibold text-slate-700 dark:text-slate-200">{req.timeOut}</span>
                      </p>
                      <p className="text-slate-450 mt-0.5">Reason: "{req.reason}"</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {req.status === 'Pending' && (userRole === 'HR Admin' || userRole === 'Super Admin') ? (
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleApproveReg(req.id, req.employeeName, req.date)}
                            disabled={updateRegMut.isPending}
                            className="p-1 bg-green-500 text-white rounded-lg hover:scale-105 disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleRejectReg(req.id, req.employeeName, req.date)}
                            disabled={updateRegMut.isPending}
                            className="p-1 bg-red-500 text-white rounded-lg hover:scale-105 disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          req.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                          req.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
        {/* ======================================= */}
      {/* 4. MUSTER ROLL CALENDAR                 */}
      {/* ======================================= */}
      {activeSubModule === 'muster' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in text-xs">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                  Muster Roll Grid — {monthNames[musterMonth]} {musterYear}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Showing monthly attendance status for <span className="font-semibold text-slate-700 dark:text-slate-200">{targetMusterEmployee?.name || 'Employee'}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Employee Filter */}
                <select
                  value={targetMusterEmpId}
                  onChange={(e) => setMusterEmpId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold focus:outline-none text-xs"
                >
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                      {emp.name} ({emp.designation || 'Staff'})
                    </option>
                  ))}
                </select>

                {/* Month Selector */}
                <select
                  value={musterMonth}
                  onChange={(e) => setMusterMonth(parseInt(e.target.value))}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold focus:outline-none text-xs"
                >
                  {monthNames.map((m, idx) => (
                    <option key={m} value={idx} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{m}</option>
                  ))}
                </select>

                {/* Year Selector */}
                <select
                  value={musterYear}
                  onChange={(e) => setMusterYear(parseInt(e.target.value))}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold focus:outline-none text-xs"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{y}</option>
                  ))}
                </select>

                <button 
                  onClick={() => {
                    const csvRows = ["Day,Date,Status,Punches"];
                    dynamicMusterDays.forEach(d => csvRows.push(`${d.dayNum},${d.dateStr},${d.status},${d.punchesCount}`));
                    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Muster_Roll_${targetMusterEmployee?.name || 'Employee'}_${monthNames[musterMonth]}_${musterYear}.csv`;
                    a.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl font-bold shadow-sm hover:scale-105 transition-all text-xs cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
            
            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 gap-2 mt-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
                <div key={w} className="text-center font-extrabold text-slate-400 dark:text-slate-400 py-1 text-[11px] uppercase tracking-wider">{w}</div>
              ))}
              
              {/* Dynamic Offset padding days */}
              {Array.from({ length: firstDayOfWeekIndex }).map((_, idx) => (
                <div key={`offset-${idx}`} className="py-2 border border-transparent"></div>
              ))}

              {/* Dynamic Month Days */}
              {dynamicMusterDays.map((d) => (
                <div 
                  key={d.dayNum} 
                  className={`border rounded-xl p-2.5 text-center flex flex-col justify-between h-16 cursor-pointer hover:border-primary hover:shadow-md transition-all ${
                    d.status === 'Present' ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40' :
                    d.status === 'Late' ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40' :
                    d.status === 'Absent' ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' :
                    d.status === 'Holiday' || d.status === 'WeekOff' ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40' :
                    'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                  }`}
                  onClick={() => {
                    if (d.status === 'Absent' || d.status === 'Late') {
                      setRegDate(d.dateStr);
                      setActiveSubModule('regularize');
                    } else {
                      showAlert(`Date: ${d.dateStr} | Status: ${d.status} | Recorded Punches: ${d.punchesCount}`, "Muster Day Details", "info");
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-white text-xs">{d.dayNum}</span>
                    {d.punchesCount > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title={`${d.punchesCount} punches`}></span>
                    )}
                  </div>
                  <span className={`text-[9px] font-extrabold block uppercase tracking-tight ${
                    d.status === 'Present' ? 'text-emerald-600 dark:text-emerald-400' :
                    d.status === 'Late' ? 'text-amber-600 dark:text-amber-400' :
                    d.status === 'Absent' ? 'text-rose-600 dark:text-rose-400' :
                    d.status === 'Holiday' || d.status === 'WeekOff' ? 'text-blue-600 dark:text-blue-400' :
                    'text-slate-400 dark:text-slate-500'
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-4 items-center mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 justify-center text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>Present</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>Late</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>Absent</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>Holiday</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span>WeekOff</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 5. ATTENDANCE REPORTS                   */}
      {/* ======================================= */}
      {activeSubModule === 'reports' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Top Control Bar & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Filter controls */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs border-b pb-1.5 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Select Month & Year
              </h4>
              <div className="flex gap-2">
                <select 
                  value={reportMonth} 
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="w-1/2 px-2 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                >
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
                <select 
                  value={reportYear} 
                  onChange={(e) => setReportYear(e.target.value)}
                  className="w-1/2 px-2 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>

            {/* Average Attendance Stat */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Average Attendance Rate</span>
                <h3 className="text-xl font-extrabold text-emerald-500 mt-1">94.8%</h3>
              </div>
              <span className="text-[9px] text-slate-400 mt-2">Target benchmark: &gt;95.0%</span>
            </div>

            {/* Late Arrivals Stat */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Late Arrival Percentage</span>
                <h3 className="text-xl font-extrabold text-amber-500 mt-1">3.1%</h3>
              </div>
              <span className="text-[9px] text-slate-400 mt-2">Grace period allowed: 10 mins</span>
            </div>

            {/* Total Man-Hours worked */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Work Hours Tracked</span>
                <h3 className="text-xl font-extrabold text-primary mt-1">
                  {(employeesList.length * 22 * 8).toLocaleString()} Hrs
                </h3>
              </div>
              <span className="text-[9px] text-slate-400 mt-2">Based on 22 billing days</span>
            </div>

          </div>

          {/* Main Register Table Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Monthly Attendance Summary Register</h3>
                <p className="text-[10px] text-slate-400">Detailed breakdown of login averages, punctuality, and attendance rates.</p>
              </div>
              
              {/* Search / Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search Employee..." 
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 w-full sm:w-48 text-[11px]" 
                  />
                </div>
                <button 
                  onClick={() => alert("Exporting Attendance Summary to CSV...")}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border text-slate-700 dark:text-slate-300 rounded-lg font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Report</span>
                </button>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b">
                  <tr>
                    <th className="p-3">Employee ID</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-center">Present</th>
                    <th className="p-3 text-center">Late</th>
                    <th className="p-3 text-center">Absent</th>
                    <th className="p-3 text-center">Avg Login</th>
                    <th className="p-3 text-right">Total Hours</th>
                    <th className="p-3 text-center">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-650 dark:text-slate-350">
                  {employeesList
                    .filter(emp => emp.name.toLowerCase().includes(reportSearch.toLowerCase()) || emp.id.toLowerCase().includes(reportSearch.toLowerCase()))
                    .map((emp) => {
                      const selectedMonthIdx = monthNames.findIndex(m => m.toLowerCase() === reportMonth.toLowerCase());
                      const targetMonth = selectedMonthIdx !== -1 ? selectedMonthIdx : new Date().getMonth();
                      const targetYear = parseInt(reportYear) || new Date().getFullYear();

                      // Filter punch logs for this employee in selected month & year
                      const empLogs = punchLogList.filter(log => {
                        const isMatch = !log.employeeId || log.employeeId === emp.id;
                        if (!isMatch) return false;
                        if (log.createdAt) {
                          const d = new Date(log.createdAt);
                          return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
                        }
                        if (log.time) {
                          return log.time.toLowerCase().includes(reportMonth.slice(0, 3).toLowerCase());
                        }
                        return true;
                      });

                      // Group punches by day
                      const dayPunchesMap: Record<number, typeof empLogs> = {};
                      empLogs.forEach((log, idx) => {
                        const d = log.createdAt ? new Date(log.createdAt) : null;
                        const dayNum = d ? d.getDate() : (idx + 1);
                        if (!dayPunchesMap[dayNum]) dayPunchesMap[dayNum] = [];
                        dayPunchesMap[dayNum].push(log);
                      });

                      let presentDays = 0;
                      let lateDays = 0;
                      let totalWorkMinutes = 0;
                      let loginTimesInMinutes: number[] = [];

                      Object.entries(dayPunchesMap).forEach(([_, punches]) => {
                        const firstIn = punches.find(p => p.type === 'In') || punches[0];
                        if (firstIn) {
                          const dt = firstIn.createdAt ? new Date(firstIn.createdAt) : null;
                          if (dt && !isNaN(dt.getTime())) {
                            const hours = dt.getHours();
                            const mins = dt.getMinutes();
                            loginTimesInMinutes.push(hours * 60 + mins);
                            if (hours >= 10) {
                              lateDays++;
                            } else {
                              presentDays++;
                            }
                          } else {
                            presentDays++;
                          }
                        } else {
                          presentDays++;
                        }
                        // Default 8.5 hrs per worked day
                        totalWorkMinutes += 8.5 * 60;
                      });

                      // Check approved regularizations for this employee in target month
                      const approvedRegs = regularizeRequests.filter(req => {
                        const isEmp = req.employeeId === emp.id || req.employeeName === emp.name;
                        if (!isEmp || req.status !== 'Approved') return false;
                        const [y, m] = req.date.split('-');
                        return parseInt(y) === targetYear && (parseInt(m) - 1) === targetMonth;
                      });

                      const regDaysCount = approvedRegs.length;
                      presentDays += regDaysCount;

                      const daysInSelectedMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                      let totalWorkingDays = 0;
                      const today = new Date();

                      for (let d = 1; d <= daysInSelectedMonth; d++) {
                        const checkDate = new Date(targetYear, targetMonth, d);
                        if (checkDate > today) break;
                        const dayOfWeek = checkDate.getDay();
                        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                          totalWorkingDays++;
                        }
                      }

                      if (totalWorkingDays === 0) totalWorkingDays = 22; // Fallback standard working days

                      const totalAttended = presentDays + lateDays;
                      const absentDays = Math.max(0, totalWorkingDays - totalAttended);

                      // Calculate Average Login Time
                      let avgLogin = 'N/A';
                      if (loginTimesInMinutes.length > 0) {
                        const avgMinTotal = Math.round(loginTimesInMinutes.reduce((a, b) => a + b, 0) / loginTimesInMinutes.length);
                        const avgH = Math.floor(avgMinTotal / 60);
                        const avgM = avgMinTotal % 60;
                        const ampm = avgH >= 12 ? 'PM' : 'AM';
                        const h12 = avgH % 12 || 12;
                        avgLogin = `${String(h12).padStart(2, '0')}:${String(avgM).padStart(2, '0')} ${ampm}`;
                      } else if (presentDays > 0) {
                        avgLogin = '09:15 AM';
                      }

                      const totalHours = (totalWorkMinutes / 60) + (regDaysCount * 8.5);
                      const attendanceRate = Math.min(100, Math.round((totalAttended / totalWorkingDays) * 100));

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="p-3 font-semibold text-slate-500">{emp.id}</td>
                          <td className="p-3 font-bold text-slate-800 dark:text-white">{emp.name}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{emp.department?.name || 'Operations'}</td>
                          <td className="p-3 text-center font-bold text-green-500">{presentDays}</td>
                          <td className="p-3 text-center font-bold text-amber-500">{lateDays}</td>
                          <td className="p-3 text-center font-bold text-red-500">{absentDays}</td>
                          <td className="p-3 text-center text-slate-600 dark:text-slate-355">{avgLogin}</td>
                          <td className="p-3 text-right font-semibold">
                            {totalHours.toFixed(1)} Hrs
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                                <div 
                                  className={`h-full rounded-full ${
                                    attendanceRate >= 95 ? 'bg-green-500' :
                                    attendanceRate >= 90 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${attendanceRate}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-[10px] w-8 text-right">{attendanceRate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* ======================================= */}
      {/* 6. GEOFENCING CONFIGURATION             */}
      {/* ======================================= */}
      {activeSubModule === 'geofence' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-xs">
          
          {/* Left panel: Form and List (stacked) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center justify-between">
                <span>Add Office Geofence</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold uppercase">
                  Setup Perimeter
                </span>
              </h3>
              
              <form onSubmit={handleAddGeofence} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Location name</label>
                  <input 
                    type="text" 
                    value={newFenceName} 
                    onChange={(e) => setNewFenceName(e.target.value)}
                    placeholder="e.g. Ranchi Branch Office"
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Latitude</label>
                    <input 
                      type="number" 
                      step="0.000001"
                      value={newFenceLat} 
                      onChange={(e) => setNewFenceLat(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Longitude</label>
                    <input 
                      type="number" 
                      step="0.000001"
                      value={newFenceLng} 
                      onChange={(e) => setNewFenceLng(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Perimeter Radius (in meters)</label>
                  <input 
                    type="number" 
                    value={newFenceRadius} 
                    onChange={(e) => setNewFenceRadius(parseInt(e.target.value) || 0)}
                    min="5"
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
                    className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Auto GPS</span>
                  </button>
                  <button 
                    type="submit" 
                    disabled={createFenceMut.isPending}
                    className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold hover:scale-105 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="h-3.5 w-3.5 text-white" />
                    <span>{createFenceMut.isPending ? "Locking..." : "Add & Lock Boundary"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                <span>Active Geofenced Areas</span>
                <span className="text-[10px] text-slate-400 font-medium">Total: {fencesList.length}</span>
              </h3>
              
              {fencesLoading ? (
                <p className="text-slate-400 text-center py-4">Loading boundaries...</p>
              ) : fencesList.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No geofenced boundaries registered.</p>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  {fencesList.map((fence) => {
                    const distanceToFence = Math.round(localDistance(gpsCoordinates.lat, gpsCoordinates.lng, fence.lat, fence.lng));
                    const isSimInside = distanceToFence <= fence.radius;

                    return (
                      <div 
                        key={fence.id} 
                        onClick={() => {
                          setNewFenceName(fence.name);
                          setNewFenceLat(fence.lat);
                          setNewFenceLng(fence.lng);
                          setNewFenceRadius(fence.radius);
                        }}
                        className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 gap-4 text-xs hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer group"
                        title="Click to auto-fill location details into form"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-white truncate max-w-[120px]" title={fence.name}>
                              {fence.name}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                              fence.isActive ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {fence.radius}m
                            </span>
                          </div>
                          <p className="text-[10px] font-medium text-slate-500">
                            Dist: <span className={isSimInside ? "text-emerald-500 font-bold" : "text-rose-500"}>{distanceToFence}m ({isSimInside ? "Inside" : "Outside"})</span>
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGeofence(fence.id, fence.name);
                            }}
                            disabled={deleteFenceMut.isPending}
                            className="p-1.5 bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg hover:scale-110 transition-all"
                            title="Delete Geofence"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right panel: Huge Map (col-span-7) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Geofencing Radar Monitor</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Click anywhere on the map to automatically position and grab coordinates.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500"></span>Selected</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500"></span>Active Fences</span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner relative flex-1 h-[750px] bg-slate-100 dark:bg-slate-950">
              <div ref={mapRef} className="w-full h-full" />
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl font-semibold text-[10px] flex items-center gap-1.5 select-none pointer-events-none border border-white/10 shadow-lg">
                <MapPin className="h-3.5 w-3.5 text-indigo-400 animate-bounce" />
                <span>Selected: {newFenceLat.toFixed(6)}, {newFenceLng.toFixed(6)}</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

const localDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

