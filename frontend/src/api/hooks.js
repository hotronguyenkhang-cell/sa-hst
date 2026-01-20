import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'https://tender-backendsa-hst.onrender.com/api';

// API client
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// Upload tender document
export const useUploadDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ files, title }) => {
            const formData = new FormData();
            files.forEach((file) => formData.append('files', file));
            if (title) formData.append('title', title);

            const { data } = await api.post('/tender/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['documents']);
        },
    });
};

// Get document status
export const useDocumentStatus = (documentId, options = {}) => {
    return useQuery({
        queryKey: ['documentStatus', documentId],
        queryFn: async () => {
            const { data } = await api.get(`/tender/${documentId}/status`);
            return data.data;
        },
        enabled: !!documentId,
        refetchInterval: (data) => {
            // Poll every 2 seconds if not completed
            if (data?.status !== 'COMPLETED' && data?.status !== 'FAILED') {
                return 2000;
            }
            return false;
        },
        ...options,
    });
};

// Get document analysis
export const useDocumentAnalysis = (documentId) => {
    return useQuery({
        queryKey: ['documentAnalysis', documentId],
        queryFn: async () => {
            const { data } = await api.get(`/tender/${documentId}/analysis`);
            return data.data;
        },
        enabled: !!documentId,
    });
};

// Get documents list
export const useDocumentsList = (filters = {}) => {
    return useQuery({
        queryKey: ['documents', filters],
        queryFn: async () => {
            const { data } = await api.get('/tender/list', { params: filters });
            return data.data;
        },
    });
};

// Get similar documents
export const useSimilarDocuments = (documentId, limit = 5) => {
    return useQuery({
        queryKey: ['similarDocuments', documentId, limit],
        queryFn: async () => {
            const { data } = await api.get(`/tender/${documentId}/similar`, {
                params: { limit },
            });
            return data.data.similar;
        },
        enabled: !!documentId,
    });
};

// Update tender document (metadata like title)
export const useUpdateTender = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, title }) => {
            const { data } = await api.patch(`/tender/${id}`, { title });
            return data.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['documents']);
            queryClient.invalidateQueries(['documentAnalysis', variables.id]);
            queryClient.invalidateQueries(['documentStatus', variables.id]);
        }
    });
};

// Delete document
export const useDeleteDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (documentId) => {
            const { data } = await api.delete(`/tender/${documentId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['documents']);
        },
        onError: (error) => {
            console.error('Delete mutation error:', error);
        }
    });
};

// WebSocket hook for realtime updates
export const useWebSocket = (documentId, onProgress) => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';

    const connect = () => {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connected');
            ws.send(JSON.stringify({ type: 'subscribe', documentId }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'progress' && data.documentId === documentId) {
                onProgress(data.progress);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return ws;
    };

    return { connect };
};

// Submit Pre-feasibility
export const useSubmitPreFeasibility = (documentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(`/tender/${documentId}/pre-feasibility`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['documentAnalysis', documentId]);
        },
    });
};

// Submit Technical Evaluation
export const useSubmitTechnicalEval = (documentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(`/tender/${documentId}/technical-eval`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['documentAnalysis', documentId]);
        },
    });
};

// Submit Financial Evaluation
export const useSubmitFinancialEval = (documentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(`/tender/${documentId}/financial-eval`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['documentAnalysis', documentId]);
        },
    });
};

// Submit Approval
export const useSubmitApproval = (documentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(`/tender/${documentId}/approve`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['documentAnalysis', documentId]);
            queryClient.invalidateQueries(['documentStatus', documentId]);
        },
    });
};

// Phase 9: Dynamic Evaluation Hooks
export const useEvaluators = () => {
    return useQuery({
        queryKey: ['evaluators'],
        queryFn: async () => {
            const res = await api.get('/tender/evaluators');
            return res.data.data;
        }
    });
};

export const useSetupTenderCriteria = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.post(`/tender/${id}/setup-criteria`, data);
            return res.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['tender-analysis', variables.id]);
        }
    });
};


// Update Line Item
export const useUpdateLineItem = (documentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ itemId, data }) => {
            const response = await api.put(`/tender/${documentId}/line-items/${itemId}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['documentAnalysis', documentId]);
        },
    });
};

// Save Bidding Config
export const useSaveBiddingConfig = (documentId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(`/tender/${documentId}/bidding-config`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['documentAnalysis', documentId]);
        },
    });
};

// Get Tender Comparison
export const useTenderComparison = (ids) => {
    return useQuery({
        queryKey: ['tenderComparison', ids],
        queryFn: async () => {
            const { data } = await api.get('/tender/compare', { params: { ids } });
            return data.data;
        },
        enabled: !!ids,
    });
};

// Analytics Summary
export const useAnalyticsSummary = () => {
    return useQuery({
        queryKey: ['analyticsSummary'],
        queryFn: async () => {
            const { data } = await api.get('/analytics/summary');
            return data;
        }
    });
};

// Vendor Performance Analytics
export const useVendorAnalytics = () => {
    return useQuery({
        queryKey: ['vendorAnalytics'],
        queryFn: async () => {
            const { data } = await api.get('/analytics/vendors');
            return data;
        }
    });
};

// --- Company Profile Hooks (Phase 10) ---

export const useCompanyProfile = () => {
    return useQuery({
        queryKey: ['companyProfile'],
        queryFn: async () => {
            const { data } = await api.get('/company/profile');
            return data.data;
        }
    });
};

export const useUpdateCompanyProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/company/profile', data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['companyProfile']);
        }
    });
};

export const useAddCompanyFinance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/company/finance', data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['companyProfile']);
        }
    });
};

export const useAddCompanyExperience = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/company/experience', data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['companyProfile']);
        }
    });
};

export default api;



