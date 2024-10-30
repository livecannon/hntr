'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { Moon, Sun, Plus, Send, Loader2, MoreVertical, User, Settings, Trash2 } from 'lucide-react'
import { useTheme } from 'next-themes'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type Conversation = {
  id: string
  messages: Message[]
  instructions: string
}

const ChatInterface = () => {
  const [mounted, setMounted] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [isNewConversationDialogOpen, setIsNewConversationDialogOpen] = useState(false)
  const [newInstructions, setNewInstructions] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (conversations.length === 0) {
      startNewConversation()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const startNewConversation = (instructions: string = '') => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      messages: [],
      instructions
    }
    setConversations(prev => [...prev, newConversation])
    setCurrentConversation(newConversation)
    setError(null)
    toast({
      title: "New conversation started",
      description: "You can now start chatting with the AI.",
    })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !currentConversation) return

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() }
    setCurrentConversation(prev => ({
      ...prev!,
      messages: [...prev!.messages, userMessage]
    }))
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `You are Hunter's helpful assistant. Your name is HNTR. Hunter is your creator. ${currentConversation.instructions}` },
            ...currentConversation.messages,
            userMessage
          ]
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch response')
      }

      const data = await response.json()
      const aiMessage: Message = { role: 'assistant', content: data.response, timestamp: new Date() }
      setCurrentConversation(prev => ({
        ...prev!,
        messages: [...prev!.messages, aiMessage]
      }))
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to get response. Please try again.')
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id))
    if (currentConversation?.id === id) {
      setCurrentConversation(conversations[0] || null)
    }
    toast({
      title: "Conversation deleted",
      description: "The selected conversation has been removed.",
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-muted/40 dark:bg-muted/10 flex flex-col">
        <div className="p-4 border-b border-border">
          <Button onClick={() => setIsNewConversationDialogOpen(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>
        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-2">
            {conversations.map((conv) => (
              <div key={conv.id} className="flex items-center">
                <Button
                  variant={conv.id === currentConversation?.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-left truncate"
                  onClick={() => setCurrentConversation(conv)}
                >
                  Chat {conv.id.slice(0, 8)}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => deleteConversation(conv.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border p-4 flex justify-between items-center bg-background">
          <h1 className="text-xl font-bold">Chat with AI</h1>
          <div className="flex items-center space-x-2">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">@user</h4>
                  <p className="text-sm">
                    This is you! You're chatting with an AI assistant.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-2xl mx-auto">
            {currentConversation?.messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <footer className="border-t border-border p-4 bg-background">
          <form onSubmit={sendMessage} className="flex gap-2 max-w-2xl mx-auto">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </footer>
      </div>

      <Dialog open={isNewConversationDialogOpen} onOpenChange={setIsNewConversationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a New Conversation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="instructions" className="text-right">
                Instructions:
              </label>
              <Input
                id="instructions"
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              startNewConversation(newInstructions)
              setIsNewConversationDialogOpen(false)
              setNewInstructions('')
            }}>
              Start Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

export default ChatInterface