import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditWorkshop from '../EditWorkshop';
import { supabase } from '../../supabaseClient';

vi.mock('../../supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe('EditWorkshop', () => {
    const mockOnClose = vi.fn();
    const workshop = { 
        id: 1, 
        name: 'Atelier Existant', 
        places: 10, 
        date: '2025-01-01', 
        description: 'Desc', 
        timeslot: 'matin' 
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'alert').mockImplementation(() => {});

        supabase.from.mockImplementation((table) => {
            if (table === 'workshops_participants') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ 
                            data: [{ places: 2 }, { places: 1 }], // 3 reserved
                            error: null 
                        })
                    }),
                };
            }
            if (table === 'workshops') {
                return {
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    }),
                };
            }
            return { select: vi.fn() };
        });
    });

    it('renders with initial values', async () => {
        render(<EditWorkshop workshop={workshop} onClose={mockOnClose} />);
        
        expect(screen.getByDisplayValue('Atelier Existant')).toBeInTheDocument();
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    it('updates workshop successfully', async () => {
        render(<EditWorkshop workshop={workshop} onClose={mockOnClose} />);

        // Change name
        fireEvent.change(screen.getByDisplayValue('Atelier Existant'), { target: { value: 'Atelier Modifié' } });
        
        // Click Update
        fireEvent.click(screen.getByText('Mettre à jour'));

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('workshops');
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('prevents reducing capacity below reserved seats', async () => {
        render(<EditWorkshop workshop={workshop} onClose={mockOnClose} />);

        // Wait for the fetch to happen
        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('workshops_participants');
        });

        // Try to set capacity to 2
        const capacityInput = screen.getByDisplayValue('10');
        fireEvent.change(capacityInput, { target: { value: '2' } });

        // Click Update
        fireEvent.click(screen.getByText('Mettre à jour'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Impossible de réduire le nombre de places'));
            expect(supabase.from).not.toHaveBeenCalledWith('workshops'); // Should not call update on workshops table
        });
    });
});
