import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddWorkshop from '../AddWorkshop';
import { supabase } from '../../supabaseClient';

// Mock Supabase
vi.mock('../../supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe('AddWorkshop', () => {
    const mockOnAddWorkshop = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock alert
        vi.spyOn(window, 'alert').mockImplementation(() => {});

        supabase.from.mockImplementation((table) => {
            if (table === 'shops') {
                return {
                    select: vi.fn().mockResolvedValue({ 
                        data: [{ id: 1, name: 'Boutique A' }, { id: 2, name: 'Boutique B' }], 
                        error: null 
                    }),
                };
            }
            if (table === 'workshops') {
                return {
                    insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockResolvedValue({ 
                            data: [{ id: 101, name: 'Nouvel Atelier' }], 
                            error: null 
                        })
                    }),
                };
            }
            return { select: vi.fn() };
        });
    });

    it('renders the add button initially', () => {
        render(<AddWorkshop onAddWorkshop={mockOnAddWorkshop} />);
        expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('opens modal and fetches shops when button is clicked', async () => {
        render(<AddWorkshop onAddWorkshop={mockOnAddWorkshop} />);
        
        fireEvent.click(screen.getByText('+'));

        await waitFor(() => {
            expect(screen.getByText('Ajouter un Atelier')).toBeInTheDocument();
            expect(supabase.from).toHaveBeenCalledWith('shops');
        });

        // Check if shops are loaded in the select
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
        // Note: Testing options might require waiting or specific queries depending on implementation
    });

    it('submits the form successfully', async () => {
        const { container } = render(<AddWorkshop onAddWorkshop={mockOnAddWorkshop} />);
        
        // Open modal
        fireEvent.click(screen.getByText('+'));
        await waitFor(() => screen.getByText('Ajouter un Atelier'));
        
        const nameInput = screen.getByPlaceholderText("Nom de l'atelier");
        const dateInput = container.querySelector('input[type="date"]');
        const descInput = screen.getByPlaceholderText("Description (optionnel)");
        const selects = screen.getAllByRole('combobox'); 
        // 0: Timeslot (Matin/...), 1: Shop
        
        fireEvent.change(nameInput, { target: { value: 'Atelier Fleurs' } });
        fireEvent.change(dateInput, { target: { value: '2025-12-25' } });
        fireEvent.change(descInput, { target: { value: 'Super atelier' } });
        
        // Select shop
        fireEvent.change(selects[1], { target: { value: '1' } }); // Boutique A

        // Submit
        fireEvent.click(screen.getByText('Ajouter'));

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('workshops');
            expect(mockOnAddWorkshop).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nouvel Atelier' }));
        });
    });
});
