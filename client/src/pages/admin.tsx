import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileDown, MessageSquare, Settings, Lock, Edit3, Save, X, Circle } from "lucide-react";
import { type Quote, type ShortcutSettings, type TabSettings, type UserSettings } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { UniversalNavigation } from "@/components/UniversalNavigation";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quotesImportData, setQuotesImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  
  // Edit shortcut state
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ shortcutName: string; routePath: string }>({ shortcutName: "", routePath: "" });
  
  // Edit tab state
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editTabValues, setEditTabValues] = useState<{ tabName: string; routePath: string }>({ tabName: "", routePath: "" });
  
  // App title state
  const [appTitle, setAppTitle] = useState<string>("");
  const [appTitleInitialized, setAppTitleInitialized] = useState<boolean>(false);



  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: shortcutSettings = [] } = useQuery<ShortcutSettings[]>({
    queryKey: ["/api/shortcut-settings"],
  });

  const { data: tabSettings = [] } = useQuery<TabSettings[]>({
    queryKey: ["/api/tab-settings"],
  });

  const { data: userSettings } = useQuery<UserSettings[]>({
    queryKey: ["/api/user-settings"],
  });

  // Initialize app title when userSettings loads (React Query v5 pattern)
  // Only initialize once to avoid resetting user input after successful saves
  useEffect(() => {
    if (userSettings && !appTitleInitialized) {
      if (userSettings.length > 0 && userSettings[0].appTitle) {
        setAppTitle(userSettings[0].appTitle);
      } else {
        setAppTitle("Visbal Gym Tracker"); // Default value
      }
      setAppTitleInitialized(true);
    }
  }, [userSettings, appTitleInitialized]);

  const updateShortcutMutation = useMutation({
    mutationFn: async ({ shortcutKey, isVisible }: { shortcutKey: string; isVisible: boolean }) => {
      return apiRequest("PATCH", `/api/shortcut-settings/${shortcutKey}`, { isVisible: isVisible ? 1 : 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shortcut-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shortcut-settings/visible"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update shortcut settings",
        variant: "destructive",
      });
    },
  });

  const editShortcutMutation = useMutation({
    mutationFn: async ({ shortcutKey, shortcutName, routePath }: { shortcutKey: string; shortcutName: string; routePath: string }) => {
      return apiRequest("PATCH", `/api/shortcut-settings/${shortcutKey}`, { shortcutName, routePath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shortcut-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shortcut-settings/visible"] });
      setEditingShortcut(null);
      setEditValues({ shortcutName: "", routePath: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update shortcut details",
        variant: "destructive",
      });
    },
  });

  const editTabMutation = useMutation({
    mutationFn: async ({ tabKey, tabName, routePath }: { tabKey: string; tabName: string; routePath: string }) => {
      return apiRequest("PATCH", `/api/tab-settings/${tabKey}`, { tabName, routePath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tab-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tab-settings/visible"] });
      setEditingTab(null);
      setEditTabValues({ tabName: "", routePath: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tab details",
        variant: "destructive",
      });
    },
  });

  const updateAppTitleMutation = useMutation({
    mutationFn: async ({ appTitle }: { appTitle: string }) => {
      const settingsId = userSettings && userSettings.length > 0 ? userSettings[0].id : null;
      if (settingsId) {
        return apiRequest("PATCH", `/api/user-settings/${settingsId}`, { appTitle });
      } else {
        return apiRequest("POST", "/api/user-settings", { appTitle });
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
      // Keep the local state in sync with the saved value
      setAppTitle(variables.appTitle);
      toast({
        title: "App Title Updated",
        description: "App title has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update app title",
        variant: "destructive",
      });
    },
  });

  const handleShortcutToggle = (shortcutKey: string, isVisible: boolean) => {
    updateShortcutMutation.mutate({ shortcutKey, isVisible });
  };

  const handleEditShortcut = (shortcut: ShortcutSettings) => {
    setEditingShortcut(shortcut.shortcutKey);
    setEditValues({ shortcutName: shortcut.shortcutName, routePath: shortcut.routePath });
  };

  const handleSaveShortcut = () => {
    if (editingShortcut) {
      // Validate before saving
      const trimmedName = editValues.shortcutName.trim();
      const trimmedPath = editValues.routePath.trim();
      
      if (!trimmedName || !trimmedPath || !trimmedPath.startsWith('/')) {
        toast({
          title: "Validation Error",
          description: "Shortcut name is required and route path must start with '/'",
          variant: "destructive",
        });
        return;
      }
      
      editShortcutMutation.mutate({
        shortcutKey: editingShortcut,
        shortcutName: trimmedName,
        routePath: trimmedPath
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingShortcut(null);
    setEditValues({ shortcutName: "", routePath: "" });
  };

  const handleEditTab = (tab: TabSettings) => {
    // Prevent editing locked tabs
    const isHomeTab = tab.tabKey === 'home';
    const isAdminTab = tab.tabKey === 'admin';
    if (isHomeTab || isAdminTab) return;
    
    setEditingTab(tab.tabKey);
    setEditTabValues({ tabName: tab.tabName, routePath: tab.routePath });
  };

  const handleSaveTab = () => {
    if (editingTab) {
      // Validate before saving
      const trimmedName = editTabValues.tabName.trim();
      const trimmedPath = editTabValues.routePath.trim();
      
      if (!trimmedName || !trimmedPath || !trimmedPath.startsWith('/')) {
        toast({
          title: "Validation Error",
          description: "Tab name is required and route path must start with '/'",
          variant: "destructive",
        });
        return;
      }
      
      editTabMutation.mutate({
        tabKey: editingTab,
        tabName: trimmedName,
        routePath: trimmedPath
      });
    }
  };

  const handleCancelTabEdit = () => {
    setEditingTab(null);
    setEditTabValues({ tabName: "", routePath: "" });
  };

  const handleSaveAppTitle = () => {
    const trimmedTitle = appTitle.trim();
    if (!trimmedTitle) {
      toast({
        title: "Validation Error",
        description: "App title cannot be empty",
        variant: "destructive",
      });
      return;
    }
    updateAppTitleMutation.mutate({ appTitle: trimmedTitle });
  };

  const updateTabMutation = useMutation({
    mutationFn: async ({ tabKey, isVisible }: { tabKey: string; isVisible: boolean }) => {
      return apiRequest("PATCH", `/api/tab-settings/${tabKey}`, { isVisible: isVisible ? 1 : 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tab-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tab-settings/visible"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tab settings",
        variant: "destructive",
      });
    },
  });

  const handleTabToggle = (tabKey: string, isVisible: boolean) => {
    updateTabMutation.mutate({ tabKey, isVisible });
  };



  const downloadQuotesTemplate = () => {
    const sampleQuotes = [
      '"The only way to do great work is to love what you do." - Steve Jobs',
      '"Success isn\'t always about greatness. It\'s about consistency." - Dwayne Johnson',
      '"Discipline is choosing between what you want now and what you want most." - Abraham Lincoln',
      '"Fear = Fuel" - Me',
      '"OUT WORK, OUT BELIEVE" - Me'
    ];
    
    const textContent = sampleQuotes.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotes-import-template.txt';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Quotes import template text file downloaded",
    });
  };

  const exportQuotes = () => {
    if (quotes.length === 0) {
      toast({
        title: "No Data",
        description: "No quotes to export",
        variant: "destructive",
      });
      return;
    }

    // Export in your preferred format: "Quote text" - Author
    const textContent = quotes.map(quote => {
      return `"${quote.text}" - ${quote.author}`;
    }).join('\n');
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quotes-export-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `${quotes.length} quotes exported to text file`,
    });
  };

  const importQuotes = async () => {
    if (!quotesImportData.trim()) {
      toast({
        title: "Error", 
        description: "Please paste quotes text data to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const lines = quotesImportData.trim().split('\n');
      if (lines.length < 1) {
        throw new Error("Must have at least one quote to import");
      }
      
      const parsedQuotes = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Parse format: "Quote text" - Author
        const match = trimmedLine.match(/^"(.+?)"\s*-\s*(.+)$/);
        if (match) {
          const [, text, author] = match;
          parsedQuotes.push({
            text: text.trim(),
            author: author.trim(),
            category: 'motivational', // Default category
            isActive: 1
          });
        }
      }
      
      if (parsedQuotes.length === 0) {
        throw new Error('No valid quotes found. Expected format: "Quote text" - Author');
      }

      // Clear existing quotes first
      const deletePromises = quotes.map(quote => 
        apiRequest("DELETE", `/api/quotes/${quote.id}`)
      );
      await Promise.all(deletePromises);

      // Import new quotes
      const importPromises = parsedQuotes.map(quote => 
        apiRequest("POST", "/api/quotes", quote)
      );
      await Promise.all(importPromises);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      
      toast({
        title: "Import Successful",
        description: `${parsedQuotes.length} quotes imported successfully`,
      });
      setQuotesImportData("");
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid text format",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <UniversalNavigation />
      <main className="w-full py-6 sm:py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="heading-admin">
            Admin Panel
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage quotes, customize app settings, and control interface visibility
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">


          {/* Home Screen Shortcut Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Shortcut Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Control which shortcuts are visible using the toggle switches below. Click the edit button to modify shortcut names and paths.
              </p>
              <div className="space-y-4">
                {/* Home shortcut - always enabled and locked */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50 opacity-75">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-sm">Home</div>
                      <div className="text-xs text-muted-foreground">/</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" />
                        Locked
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-green-600 font-medium">Always Enabled</div>
                </div>

                {shortcutSettings.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Loading shortcut settings...
                  </p>
                ) : (
                  shortcutSettings.map((shortcut) => {
                    const isEditing = editingShortcut === shortcut.shortcutKey;
                    
                    if (isEditing) {
                      return (
                        <div key={shortcut.shortcutKey} className="p-4 rounded-lg border bg-card shadow-sm">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`edit-name-${shortcut.shortcutKey}`} className="text-sm font-medium">
                                Shortcut Name
                              </Label>
                              <Input
                                id={`edit-name-${shortcut.shortcutKey}`}
                                value={editValues.shortcutName}
                                onChange={(e) => setEditValues(prev => ({ ...prev, shortcutName: e.target.value }))}
                                className="mt-1"
                                data-testid={`input-shortcut-name-${shortcut.shortcutKey}`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-path-${shortcut.shortcutKey}`} className="text-sm font-medium">
                                Route Path
                              </Label>
                              <Input
                                id={`edit-path-${shortcut.shortcutKey}`}
                                value={editValues.routePath}
                                onChange={(e) => setEditValues(prev => ({ ...prev, routePath: e.target.value }))}
                                className="mt-1"
                                placeholder="/example"
                                data-testid={`input-route-path-${shortcut.shortcutKey}`}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveShortcut}
                                disabled={editShortcutMutation.isPending || !editValues.shortcutName.trim() || !editValues.routePath.trim() || !editValues.routePath.startsWith('/')}
                                size="sm"
                                data-testid={`button-save-shortcut-${shortcut.shortcutKey}`}
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                disabled={editShortcutMutation.isPending}
                                variant="outline"
                                size="sm"
                                data-testid={`button-cancel-shortcut-${shortcut.shortcutKey}`}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={shortcut.shortcutKey} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-sm">{shortcut.shortcutName}</div>
                            <div className="text-xs text-muted-foreground">{shortcut.routePath}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`switch-shortcut-${shortcut.shortcutKey}`}
                              checked={shortcut.isVisible === 1}
                              onCheckedChange={(checked) => handleShortcutToggle(shortcut.shortcutKey, checked)}
                              disabled={updateShortcutMutation.isPending}
                              data-testid={`switch-shortcut-${shortcut.shortcutKey}`}
                            />
                            <Label htmlFor={`switch-shortcut-${shortcut.shortcutKey}`} className="text-sm font-normal cursor-pointer">
                              Visible
                            </Label>
                          </div>
                          <Button
                            onClick={() => handleEditShortcut(shortcut)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={`Edit ${shortcut.shortcutName}`}
                            data-testid={`button-edit-shortcut-${shortcut.shortcutKey}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tab Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Tab Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Control which tabs are visible using the toggle switches below. Click the edit button to modify tab names and paths.
              </p>
              <div className="space-y-4">
                {tabSettings.map((tab) => {
                  const isHomeTab = tab.tabKey === 'home';
                  const isAdminTab = tab.tabKey === 'admin';
                  const isLockedTab = isHomeTab || isAdminTab;
                  const isDisabled = updateTabMutation.isPending || isLockedTab;
                  const isEditing = editingTab === tab.tabKey;
                  
                  if (isEditing) {
                    return (
                      <div key={tab.tabKey} className="p-4 rounded-lg border bg-card shadow-sm">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`edit-tab-name-${tab.tabKey}`} className="text-sm font-medium">
                              Tab Name
                            </Label>
                            <Input
                              id={`edit-tab-name-${tab.tabKey}`}
                              value={editTabValues.tabName}
                              onChange={(e) => setEditTabValues(prev => ({ ...prev, tabName: e.target.value }))}
                              className="mt-1"
                              data-testid={`input-tab-name-${tab.tabKey}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-tab-path-${tab.tabKey}`} className="text-sm font-medium">
                              Route Path
                            </Label>
                            <Input
                              id={`edit-tab-path-${tab.tabKey}`}
                              value={editTabValues.routePath}
                              onChange={(e) => setEditTabValues(prev => ({ ...prev, routePath: e.target.value }))}
                              className="mt-1"
                              placeholder="/example"
                              data-testid={`input-tab-route-path-${tab.tabKey}`}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveTab}
                              disabled={editTabMutation.isPending || !editTabValues.tabName.trim() || !editTabValues.routePath.trim() || !editTabValues.routePath.startsWith('/')}
                              size="sm"
                              data-testid={`button-save-tab-${tab.tabKey}`}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelTabEdit}
                              disabled={editTabMutation.isPending}
                              variant="outline"
                              size="sm"
                              data-testid={`button-cancel-tab-${tab.tabKey}`}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Normal mode - show clean list item
                  return (
                    <div key={tab.tabKey} className={`flex items-center justify-between p-4 rounded-lg border ${isLockedTab ? 'bg-card/50 opacity-75' : 'bg-card hover:bg-accent/50'} transition-colors`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-sm">{tab.tabName}</div>
                          <div className="text-xs text-muted-foreground">{tab.routePath}</div>
                          {isLockedTab && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Lock className="w-3 h-3" />
                              Locked
                            </div>
                          )}
                        </div>
                      </div>
                      {isLockedTab ? (
                        <div className="text-sm text-green-600 font-medium">Always Enabled</div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`switch-tab-${tab.tabKey}`}
                              checked={tab.isVisible === 1}
                              onCheckedChange={(checked) => handleTabToggle(tab.tabKey, checked)}
                              disabled={updateTabMutation.isPending}
                              data-testid={`switch-tab-${tab.tabKey}`}
                            />
                            <Label htmlFor={`switch-tab-${tab.tabKey}`} className="text-sm font-normal cursor-pointer">
                              Visible
                            </Label>
                          </div>
                          <Button
                            onClick={() => handleEditTab(tab)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={`Edit ${tab.tabName}`}
                            data-testid={`button-edit-tab-${tab.tabKey}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {tabSettings.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    Loading tab settings...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>


          {/* Quotes Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Quotes Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-2">
                <Button 
                  onClick={exportQuotes}
                  className="flex items-center justify-center gap-2 h-10 text-sm px-4"
                  data-testid="button-export-quotes"
                >
                  <Download className="w-4 h-4" />
                  Export Quotes
                </Button>
                <Button 
                  onClick={downloadQuotesTemplate}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-10 text-sm px-4"
                  data-testid="button-download-quotes-template"
                >
                  <FileDown className="w-4 h-4" />
                  Download Template
                </Button>
                <span className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start px-3 py-2 sm:px-0 sm:py-0">
                  ({quotes.length} quotes)
                </span>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="quotes-import" className="text-sm font-medium">Import Quotes Data</Label>
                <Textarea
                  id="quotes-import"
                  placeholder={`Paste your quotes here...
Format: "Quote text" - Author
Example:
"The only way to do great work is to love what you do." - Steve Jobs
"Fear = Fuel" - Me`}
                  value={quotesImportData}
                  onChange={(e) => setQuotesImportData(e.target.value)}
                  className="min-h-[100px] sm:min-h-[120px] font-mono text-xs sm:text-sm resize-none"
                />
                <Button 
                  onClick={importQuotes}
                  disabled={isImporting || !quotesImportData.trim()}
                  className="flex items-center justify-center gap-2 h-10 text-sm px-4"
                  variant="outline"
                  data-testid="button-import-quotes"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? "Importing..." : "Import Quotes"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  ⚠️ This will replace ALL existing quotes data
                </p>
              </div>
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                App Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="app-title" className="text-sm font-medium">App Title</Label>
                <Input
                  id="app-title"
                  placeholder="Enter app title..."
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  className="text-sm"
                  data-testid="input-app-title"
                />
                <Button 
                  onClick={handleSaveAppTitle}
                  disabled={updateAppTitleMutation.isPending || !appTitle.trim()}
                  className="flex items-center justify-center gap-2 h-10 text-sm px-4"
                  data-testid="button-save-app-title"
                >
                  <Save className="w-4 h-4" />
                  {updateAppTitleMutation.isPending ? "Saving..." : "Save App Title"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  This will update the app title shown in the header across all pages
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
    </>
  );
}