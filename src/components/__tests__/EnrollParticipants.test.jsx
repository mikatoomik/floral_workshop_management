import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnrollParticipants from '../EnrollParticipants';
import { supabase } from '../../supabaseClient';

// Mock Supabase
vi.mock('../../supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe('EnrollParticipants', () => {
    const mockOnClose = vi.fn();
    const mockOnParticipantUpdate = vi.fn();
    const workshop = { id: 1, name: 'Atelier Test' };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock alert
        vi.spyOn(window, 'alert').mockImplementation(() => {});

        supabase.from.mockImplementation((table) => {
            if (table === 'participants') {
                return {
                    select: vi.fn().mockResolvedValue({ data: [], error: null }),
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockResolvedValue({ data: [{ id: 99, name: 'New User' }], error: null })
                    }),
                };
            }
            if (table === 'workshops_participants') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    }),
                    insert: vi.fn().mockResolvedValue({ error: null }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ error: null })
                        })
                    })
                };
            }
            return { select: vi.fn() };
        });
    });

    it('renders correctly', async () => {
        render(
            <EnrollParticipants
                workshop={workshop}
                onClose={mockOnClose}
                onParticipantUpdate={mockOnParticipantUpdate}
            />
        );
        expect(screen.getByText('Ajouter ou Rechercher un Participant')).toBeInTheDocument();
    });

    it('handles enrollment of a new participant', async () => {
        // Mock existing participants to be empty
        // Mock enrolled participants to be empty
        
        render(
            <EnrollParticipants
                workshop={workshop}
                onClose={mockOnClose}
                onParticipantUpdate={mockOnParticipantUpdate}
            />
        );

        // Simulate creating a new participant
        const input = screen.getByPlaceholderText('Rechercher ou ajouter un participant');
        fireEvent.change(input, { target: { value: 'Nouveau Participant' } });
        
        const addButton = screen.getByText('Ajouter / Sélectionner');
        fireEvent.click(addButton);

        // Should show create form
        await waitFor(() => {
            expect(screen.getByText('Créer "Nouveau Participant"')).toBeInTheDocument();
        });

        // Fill in email to pass validation
        const emailInput = screen.getByPlaceholderText('Email (optionnel)');
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        // Click "Créer et sélectionner"
        const createButton = screen.getByText('Créer et sélectionner');
        fireEvent.click(createButton);

        // Wait for the new participant to appear in the list and be checked
        // This ensures the async creation is done and state is updated
        await waitFor(() => {
             const checkbox = screen.getByLabelText('New User');
             expect(checkbox).toBeInTheDocument();
             expect(checkbox).toBeChecked();
        });

        // Now validate enrollment
        const validateButton = screen.getByText('Valider');
        fireEvent.click(validateButton);

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('workshops_participants');
            // Check if insert was called
            // Note: The exact mock implementation details might need adjustment based on how the component calls them
            // But we expect onParticipantUpdate to be called on success
            expect(mockOnParticipantUpdate).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});
