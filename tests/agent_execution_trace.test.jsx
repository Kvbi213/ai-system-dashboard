import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgentExecutionTrace, { extractTraceFromMessage } from '../modules/components/AgentExecutionTrace.jsx';
import { buildExecutionTrace } from '../modules/services/clientAiDispatcher.js';

describe('AgentExecutionTrace Component & Helper Logic Suite', () => {
  it('should not render anything when trace is empty and isLive is false', () => {
    const { container } = render(<AgentExecutionTrace trace={null} isLive={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render Working. indicator when isLive is true', () => {
    render(<AgentExecutionTrace trace={null} isLive={true} />);
    expect(screen.getByText('Working.')).toBeDefined();
  });

  it('should render explored files count and toggle list on click', () => {
    const mockTrace = {
      exploredFiles: [
        { name: 'Cloud Firestore: tasks', type: 'database', details: '5 zadań' },
        { name: 'localStorage: system_active_model', type: 'config', details: 'openai/gpt-oss-120b' }
      ]
    };

    render(<AgentExecutionTrace trace={mockTrace} />);
    expect(screen.getByText('Explored 2 files')).toBeDefined();

    // Przed kliknięciem pliki nie są widoczne
    expect(screen.queryByText('Cloud Firestore: tasks')).toBeNull();

    // Kliknij aby rozwinąć
    fireEvent.click(screen.getByText('Explored 2 files'));
    expect(screen.getByText('Cloud Firestore: tasks')).toBeDefined();
    expect(screen.getByText('localStorage: system_active_model')).toBeDefined();
    expect(screen.getByText('5 zadań')).toBeDefined();
  });

  it('should render Ran command and sanitize API keys', () => {
    const mockTrace = {
      commands: [
        {
          command: 'Ran node -e "const k = \'gsk_secretKey12345678901234567890\'; fetch(...)"',
          status: '200 OK',
          output: 'Data retrieved'
        }
      ]
    };

    render(<AgentExecutionTrace trace={mockTrace} />);
    expect(screen.getByText('Ran')).toBeDefined();
    // Klucz API powinien być zamaskowany
    expect(screen.queryByText(/gsk_secretKey/)).toBeNull();
    expect(screen.getByText(/\$API_KEY/)).toBeDefined();

    // Rozwiń szczegóły komendy
    fireEvent.click(screen.getByText('Ran'));
    expect(screen.getByText('200 OK')).toBeDefined();
    expect(screen.getByText('Data retrieved')).toBeDefined();
  });

  it('should render searches with query count badges and show results on click', () => {
    const mockTrace = {
      searches: [
        {
          query: 'topowe modele ai 2026',
          resultsCount: 5,
          results: [
            { title: 'Ranking Modeli 2026', url: 'https://example.com/models', snippet: 'Szczegółowy opis' }
          ]
        }
      ]
    };

    render(<AgentExecutionTrace trace={mockTrace} defaultExpanded={true} />);
    expect(screen.getByText('topowe modele ai 2026')).toBeDefined();
    expect(screen.getByText('5 results')).toBeDefined();

    // Kliknij w pozycję wyszukiwania aby rozwinąć źródła
    fireEvent.click(screen.getByText('topowe modele ai 2026'));
    expect(screen.getByText('Ranking Modeli 2026')).toBeDefined();
    expect(screen.getByText('Szczegółowy opis')).toBeDefined();
  });

  it('should extract trace correctly from message text (extractTraceFromMessage)', () => {
    const msg = {
      role: 'ai',
      content: '**[OMNIDAEMON] Inicjalizacja Autonomicznego Badania Ciągłego**\nWyszukiwanie Brave Search: `topowe komercyjne modele ai 2026`\nTABELA PORÓWNAWCZA MODELI'
    };

    const trace = extractTraceFromMessage(msg);
    expect(trace).not.toBeNull();
    expect(trace.exploredFiles.length).toBeGreaterThan(0);
    expect(trace.searches.length).toBeGreaterThan(0);
    expect(trace.searches[0].query).toBe('topowe komercyjne modele ai 2026');
  });

  it('should build standard execution trace with buildExecutionTrace', () => {
    const trace = buildExecutionTrace({
      text: 'dodaj zadanie kupić mleko',
      activeModel: 'openai/gpt-oss-120b',
      context: {
        tasks: [{ id: 1, title: 'kupić chleb' }]
      },
      executedTools: [
        { tool: 'tasks', command: '[ACTION:ADD_TASK title="kupić mleko"]', status: '200 OK', output: 'Dodano' }
      ]
    });

    expect(trace.exploredFiles.some(f => f.name.includes('tasks'))).toBe(true);
    expect(trace.commands.some(c => c.command.includes('[ACTION:ADD_TASK'))).toBe(true);
    expect(trace.status).toBe('completed');
  });

  it('should include operator_brain and REMEMBER / SEND_PUSH tools in extractTraceFromMessage', () => {
    const msg = {
      role: 'ai',
      content: 'Zapisano fakt w Pamięci Długoterminowej (Operator Brain): "Model o3-mini jest szybki".\n[ACTION:SEND_PUSH title="Test Push" body="Raport gotowy"]'
    };

    const trace = extractTraceFromMessage(msg);
    expect(trace).not.toBeNull();
    expect(trace.exploredFiles.some(f => f.name.includes('operator_brain'))).toBe(true);
    expect(trace.commands.some(c => c.command.includes('Operator Brain') || c.command.includes('REMEMBER'))).toBe(true);
    expect(trace.commands.some(c => c.command.includes('Pushbullet'))).toBe(true);
  });
});

